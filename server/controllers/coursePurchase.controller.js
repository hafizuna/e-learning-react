import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { User } from "../models/user.model.js";
import axios from "axios";

const CHAPA_URL = process.env.CHAPA_URL;
const CHAPA_AUTH = { headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` } };

export const createCheckoutSession = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.id;

    // Find the course and user
    const [course, user] = await Promise.all([
      Course.findById(courseId),
      User.findById(userId)
    ]);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user already purchased this course
    const existingPurchase = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed"
    });

    if (existingPurchase) {
      return res.status(400).json({ message: "Course already purchased" });
    }

    // Check for pending purchase
    const pendingPurchase = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "pending",
      createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) } // Less than 30 minutes old
    });

    if (pendingPurchase) {
      return res.status(400).json({ message: "You have a pending payment for this course" });
    }

    // Generate unique transaction reference (shorter version)
    const tx_ref = `${Date.now()}-${courseId.slice(-6)}`;

    // Convert price to cents/lowest denomination and back to string with 2 decimals
    const amount = course.coursePrice.toFixed(2);

    // Create a pending purchase record
    const purchase = new CoursePurchase({
      userId,
      courseId,
      paymentId: tx_ref,
      status: "pending",
      amount: course.coursePrice
    });
    await purchase.save();

    // Get the return URL
    const returnUrl = process.env.CLIENT_URL 
      ? `${process.env.CLIENT_URL}/verify-payment/${tx_ref}`
      : `http://localhost:5173/verify-payment/${tx_ref}`;

    // Initialize Chapa payment
    const paymentData = {
      amount,
      currency: 'ETB',
      email: user.email,
      first_name: user.name.split(' ')[0],
      last_name: user.name.split(' ').slice(1).join(' ') || 'Student',
      tx_ref,
      return_url: returnUrl,
      callback_url: returnUrl,
      customization: {
        title: 'Course Purchase',
        description: 'Purchase course access'
      }
    };

    console.log('Initializing payment with data:', JSON.stringify(paymentData, null, 2));

    const response = await axios.post(
      `${CHAPA_URL}/transaction/initialize`,
      paymentData,
      CHAPA_AUTH
    );

    console.log('Chapa API response:', JSON.stringify(response.data, null, 2));

    if (!response.data || !response.data.data || !response.data.data.checkout_url) {
      throw new Error('Invalid response from Chapa API: ' + JSON.stringify(response.data));
    }

    return res.status(200).json({
      status: 'success',
      url: response.data.data.checkout_url,
      tx_ref
    });

  } catch (error) {
    console.error('Error creating checkout session:', error.response?.data || error.message);
    
    // Delete the pending purchase if payment initialization failed
    if (tx_ref) {
      await CoursePurchase.findOneAndDelete({ paymentId: tx_ref });
    }

    return res.status(error.response?.status || 500).json({ 
      status: 'error',
      message: "Failed to initialize payment",
      details: error.response?.data || error.message 
    });
  }
};

// New endpoint to verify payment status
export const verifyPayment = async (req, res) => {
  try {
    const { tx_ref } = req.params;

    // Find the purchase record (not necessarily pending)
    const purchase = await CoursePurchase.findOne({ 
      paymentId: tx_ref
    });

    if (!purchase) {
      return res.status(404).json({ 
        status: 'error',
        message: "Purchase record not found",
        courseId: tx_ref.split('-')[1] // Extract courseId from tx_ref
      });
    }

    // If already completed, return success
    if (purchase.status === "completed") {
      return res.status(200).json({
        status: 'success',
        message: 'Payment already verified',
        courseId: purchase.courseId
      });
    }

    // Verify payment with Chapa
    const response = await axios.get(
      `${CHAPA_URL}/transaction/verify/${tx_ref}`,
      CHAPA_AUTH
    );

    console.log('Payment verification response:', response.data);

    if (response.data.status === 'success') {
      // Update purchase status to completed
      purchase.status = "completed";
      await purchase.save();

      // Add user to course's enrolled students if not already added
      await Course.findByIdAndUpdate(
        purchase.courseId,
        { $addToSet: { enrolledStudents: purchase.userId } }
      );

      return res.status(200).json({
        status: 'success',
        message: 'Payment verified successfully',
        courseId: purchase.courseId
      });
    } else {
      // Payment failed or pending
      return res.status(400).json({
        status: 'error',
        message: 'Payment verification failed',
        courseId: purchase.courseId,
        details: response.data
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error.response?.data || error.message);
    // Try to extract courseId from tx_ref if possible
    const courseId = req.params.tx_ref.split('-')[1];
    return res.status(500).json({ 
      status: 'error',
      message: "Failed to verify payment",
      courseId,
      details: error.response?.data || error.message 
    });
  }
};

export const getCourseDetailWithPurchaseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    // Get course details
    const course = await Course.findById(courseId)
      .populate('creator', 'name email')
      .populate('lectures')
      .select('-enrolledStudents'); // Don't send enrolled students list

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Get all completed purchases for this course
    const totalPurchases = await CoursePurchase.countDocuments({
      courseId,
      status: "completed"
    });

    // Check if the current user has purchased this course
    const userPurchase = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed"
    });

    // Check for pending purchase
    const pendingPurchase = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "pending",
      createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) }
    });

    // Prepare course data with purchase status
    const courseData = {
      ...course.toObject(),
      totalEnrolled: totalPurchases,
      lectures: course.lectures.map(lecture => ({
        ...lecture.toObject(),
        videoUrl: lecture.isPreviewFree ? lecture.videoUrl : null // Only send video URL for preview lectures
      }))
    };

    return res.status(200).json({
      course: courseData,
      isPurchased: !!userPurchase,
      hasPendingPurchase: !!pendingPurchase
    });

  } catch (error) {
    console.error('Error getting course details:', error);
    return res.status(500).json({ message: "Failed to get course details" });
  }
};

export const getAllPurchasedCourses = async (req, res) => {
  try {
    const userId = req.id;

    // Find all completed purchases for the user
    const purchases = await CoursePurchase.find({
      userId,
      status: "completed"
    }).populate({
      path: 'courseId',
      populate: [
        { path: 'creator', select: 'name email' },
        { path: 'lectures' }
      ]
    });

    // Extract course details from purchases
    const courses = purchases.map(purchase => purchase.courseId);

    return res.status(200).json({ courses });
  } catch (error) {
    console.error('Error getting purchased courses:', error);
    return res.status(500).json({ message: "Error getting purchased courses" });
  }
};
