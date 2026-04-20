import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { ReviewController } from "./review.controllers";

const router = Router();

// Create a review
router.post("/", auth, ReviewController.createReview);

// Get my reviews (for sellers)
router.get("/my-reviews", auth, ReviewController.getMyReviews);

// Get reviews for a user (seller)
router.get("/user/:userId", ReviewController.getUserReviews);

// Get reviews for a product
router.get("/product/:productId", ReviewController.getProductReviews);

// Get all reviews (Admin)
router.get("/", auth, authorize(["ADMIN"]), ReviewController.getAllReviews);

// Delete a review
router.delete("/:id", auth, ReviewController.deleteReview);

// Update review visibility (Admin)
router.patch("/:id/visibility", auth, authorize(["ADMIN"]), ReviewController.updateReviewVisibility);

export const ReviewRoutes = router;
