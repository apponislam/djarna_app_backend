import { Router } from "express";
import { FollowController } from "./follow.controllers";
import auth from "../../middlewares/auth";

const router = Router();

// Follow a user
router.post("/", auth, FollowController.followUser);

// Unfollow a user
router.delete("/:followingId", auth, FollowController.unfollowUser);

// Get followers of a user
router.get("/followers/:userId", FollowController.getFollowers);

// Get following users of a user
router.get("/following/:userId", FollowController.getFollowing);

// Check if current user is following another user
router.get("/status/:followingId", auth, FollowController.checkFollowStatus);

export const FollowRoutes = router;
