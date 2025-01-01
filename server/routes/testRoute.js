import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { createTest, getTestsByCourse, getTestById, deleteQuestion } from "../controllers/testController.js";

const router = express.Router();

// Create a new test (only instructors)
router.post(
  "/create",
  isAuthenticated,
  createTest
);

// Get all tests for a course
router.get(
  "/course/:courseId",
  isAuthenticated,
  getTestsByCourse
);

// Get test by ID
router.get(
  "/:id",
  isAuthenticated,
  getTestById
);

// Delete a question from a test
router.delete(
  "/:testId/question/:questionId",
  isAuthenticated,
  deleteQuestion
);

export default router;
