import express from "express";
import { createCheckoutSession, getCourseDetailWithStatus, getPurchasedCourses } from "../controllers/purchase.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.get("/course/:courseId/detail-with-status", isAuthenticated, getCourseDetailWithStatus);
router.get("/", isAuthenticated, getPurchasedCourses);
router.post("/checkout/create-checkout-session", isAuthenticated, createCheckoutSession);

export default router;
