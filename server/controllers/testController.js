import Test from "../models/testModel.js";
import { Course } from "../models/course.model.js";

// Create a new test
export const createTest = async (req, res) => {
  try {
    const { courseId, questions } = req.body;

    // Check if course exists and user is the creator
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    if (course.creator.toString() !== req.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create tests for this course"
      });
    }

    // Check if a test already exists for this course
    const existingTest = await Test.findOne({ courseId });

    let test;
    if (existingTest) {
      // If test exists, append new questions to it
      test = await Test.findByIdAndUpdate(
        existingTest._id,
        {
          $push: { questions: { $each: questions } }
        },
        { new: true }
      );
    } else {
      // If no test exists, create a new one
      test = await Test.create({
        courseId,
        questions,
        createdBy: req.id,
      });
    }

    res.status(201).json({
      success: true,
      test,
      message: existingTest ? "Questions added to existing test" : "New test created"
    });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to create test"
    });
  }
};

// Get tests for a course
export const getTestsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const tests = await Test.find({ courseId })
      .populate("createdBy", "name email")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      tests,
    });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get tests"
    });
  }
};

// Get test by ID
export const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate("courseId", "courseTitle")
      .populate("createdBy", "name email");

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }

    res.status(200).json({
      success: true,
      test,
    });
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get test"
    });
  }
};

// Delete a question from a test
export const deleteQuestion = async (req, res) => {
  try {
    const { testId, questionId } = req.params;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }

    if (test.createdBy.toString() !== req.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to modify this test"
      });
    }

    // Remove the question from the questions array
    const updatedTest = await Test.findByIdAndUpdate(
      testId,
      {
        $pull: { questions: { _id: questionId } }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      test: updatedTest,
      message: "Question deleted successfully"
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete question"
    });
  }
};
