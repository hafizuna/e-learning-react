import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { User } from "../models/user.model.js";
import { initializePayment, verifyTransaction, generateTransactionRef } from "../config/chapa.js";

// Helper function to truncate text
const truncate = (str, maxLength) => {
  if (str.length <= maxLength) return str;
  return str.substr(0, maxLength - 3) + '...';
};

// Helper function to sanitize text for Chapa
const sanitizeText = (text) => {
  return text.replace(/[^a-zA-Z0-9\s.-]/g, '');
};

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.id;
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found!" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Check for existing pending purchase
    const existingPending = await CoursePurchase.findOne({
      courseId,
      userId,
      status: "pending",
      createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) }
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: "You have a pending payment for this course. Please complete it or wait 30 minutes to try again."
      });
    }

    // Clean up old pending purchases
    await CoursePurchase.updateMany(
      {
        courseId,
        userId,
        status: "pending",
        createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) }
      },
      { $set: { status: "failed" } }
    );

    // Generate unique transaction reference
    const tx_ref = generateTransactionRef();

    // Create a new course purchase record
    const newPurchase = new CoursePurchase({
      courseId,
      userId,
      amount: course.coursePrice,
      status: "pending",
      paymentId: tx_ref
    });

    // Get the webhook URL - prefer environment variable, fallback to localhost
    const webhookUrl = process.env.WEBHOOK_URL || `${process.env.SERVER_URL}/api/v1/purchase/webhook`;
    console.log('Using webhook URL:', webhookUrl);

    // Get the return URL
    const returnUrl = process.env.CLIENT_URL 
      ? `${process.env.CLIENT_URL}/course-progress/${courseId}`
      : `http://localhost:5173/course-progress/${courseId}`;

    // Prepare customization data with proper length limits
    const customization = {
      title: truncate(sanitizeText(course.courseTitle), 16),
      description: truncate(course.subTitle || course.courseTitle, 50)
    };

    // Initialize Chapa payment
    const paymentData = {
      amount: course.coursePrice.toString(),
      currency: 'ETB',
      email: user.email,
      first_name: user.name.split(' ')[0],
      last_name: user.name.split(' ').slice(1).join(' ') || 'Student',
      tx_ref,
      callback_url: webhookUrl,
      return_url: `${process.env.CLIENT_URL}/course-progress/${courseId}`,
      customization
    };

    console.log('Initializing Chapa payment with:', {
      ...paymentData,
      webhook_url: webhookUrl,
      return_url: returnUrl
    });

    const chapaResponse = await initializePayment(paymentData);

    if (!chapaResponse.data?.checkout_url) {
      return res.status(400).json({ 
        success: false, 
        message: "Error while creating payment session" 
      });
    }

    // Save the purchase record
    await newPurchase.save();

    // Set a timeout to mark the payment as failed if not completed
    setTimeout(async () => {
      const purchase = await CoursePurchase.findOne({ paymentId: tx_ref });
      if (purchase && purchase.status === "pending") {
        purchase.status = "failed";
        await purchase.save();
        console.log(`Payment ${tx_ref} marked as failed due to timeout`);
      }
    }, 30 * 60 * 1000); // 30 minutes timeout

    return res.status(200).json({
      success: true,
      url: chapaResponse.data.checkout_url
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    return res.status(500).json({
      success: false,
      message: error.response?.data?.message || "Internal server error while creating payment session"
    });
  }
};

export const chapaWebhook = async (req, res) => {
  try {
    console.log('Received webhook payload:', {
      body: req.body,
      headers: req.headers,
      rawBody: req.rawBody
    });

    const { tx_ref, status } = req.body;
    
    if (!tx_ref) {
      console.error('No tx_ref in webhook payload');
      return res.status(400).json({ message: 'Missing tx_ref' });
    }

    // Verify the transaction with Chapa
    try {
      const verificationResponse = await verifyTransaction(tx_ref);
      console.log('Chapa verification response:', verificationResponse);
      
      if (!verificationResponse.data || verificationResponse.data.status !== 'success') {
        console.error('Transaction verification failed:', verificationResponse);
        return res.status(400).json({ message: 'Invalid transaction' });
      }
    } catch (verifyError) {
      console.error('Error verifying transaction:', verifyError);
      return res.status(500).json({ message: 'Error verifying transaction' });
    }

    // Find the purchase record
    const purchase = await CoursePurchase.findOne({ paymentId: tx_ref });
    if (!purchase) {
      console.error('Purchase record not found for tx_ref:', tx_ref);
      return res.status(404).json({ message: 'Purchase record not found' });
    }

    console.log('Found purchase record:', purchase);

    // Update purchase status
    const oldStatus = purchase.status;
    purchase.status = status === 'success' ? 'completed' : 'failed';
    await purchase.save();
    
    console.log(`Updated purchase status from ${oldStatus} to ${purchase.status}`);

    // If payment successful, update user's enrolled courses
    if (status === 'success') {
      console.log('Payment successful, updating enrollments...');
      
      try {
        // Update user's enrolled courses
        await User.findByIdAndUpdate(
          purchase.userId,
          { $addToSet: { enrolledCourses: purchase.courseId } }
        );

        // Update course's enrolled students
        await Course.findByIdAndUpdate(
          purchase.courseId,
          { $addToSet: { enrolledStudents: purchase.userId } }
        );
        
        console.log('Successfully updated enrollments');
      } catch (enrollError) {
        console.error('Error updating enrollments:', enrollError);
        // Don't return error - payment was still successful
      }
    }

    return res.status(200).json({ 
      message: 'Webhook processed successfully',
      status: purchase.status,
      tx_ref
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ 
      message: 'Error processing webhook',
      error: error.message 
    });
  }
};

export const getCourseDetailWithPurchaseStatus = async (req, res) => {
  try {
    const userId = req.id;
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .populate("creator", "name")
      .populate("lectures");

    if (!course) {
      return res.status(404).json({ message: "Course not found!" });
    }

    // Check for a completed purchase
    const completedPurchase = await CoursePurchase.findOne({
      courseId,
      userId,
      status: "completed",
    });

    // Check for a pending purchase
    const pendingPurchase = await CoursePurchase.findOne({
      courseId,
      userId,
      status: "pending",
    });

    // Add purchase status information to the response
    return res.status(200).json({
      success: true,
      course,
      isPurchased: !!completedPurchase,
      hasPendingPurchase: !!pendingPurchase,
      purchaseStatus: completedPurchase ? "completed" : (pendingPurchase ? "pending" : "none")
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching course details" });
  }
};

export const getAllPurchasedCourse = async (req, res) => {
  try {
    const purchasedCourse = await CoursePurchase.find({
      status: "completed",
    }).populate({
      path: "courseId",
      populate: {
        path: "creator",
        select: "name",
      },
    });

    return res.status(200).json({
      success: true,
      purchasedCourse,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching purchased courses" });
  }
};
