import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { 
  createCheckoutSession, 
  getAllPurchasedCourse, 
  getCourseDetailWithPurchaseStatus, 
  chapaWebhook 
} from "../controllers/coursePurchase.controller.js";

const router = express.Router();

// Regular routes with authentication
router.route("/checkout/create-checkout-session").post(isAuthenticated, createCheckoutSession);
router.route("/course/:courseId/detail-with-status").get(isAuthenticated, getCourseDetailWithPurchaseStatus);
router.route("/").get(isAuthenticated, getAllPurchasedCourse);

// Webhook route - no authentication required, but verify Chapa signature
router.route("/webhook")
  .post(
    express.json({ 
      verify: (req, res, buf) => {
        req.rawBody = buf.toString();
      }
    }), 
    chapaWebhook
  );

export default router;