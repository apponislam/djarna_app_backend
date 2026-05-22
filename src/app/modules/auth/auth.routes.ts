import { Router } from "express";
import { authControllers } from "./auth.controllers";
import validateRequest from "../../middlewares/validateRequest";
import { changePasswordSchema, loginSchema, sendOtpSchema, verifyOtpSchema, requestPasswordResetSchema, resetPasswordSchema, registerSchema, updateProfileSchema } from "./auth.validations";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { parseBodyData, uploadProfileImage } from "../../middlewares/multer";
import passport from "../../../utils/passport";

const router = Router();

// ==================== OAuth Routes ====================
// Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { session: false }), authControllers.oauthCallback);

// Facebook
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));
router.get("/facebook/callback", passport.authenticate("facebook", { session: false }), authControllers.oauthCallback);

// Apple
router.get("/apple", passport.authenticate("apple", { scope: ["email", "name"] }));
router.post("/apple/callback", passport.authenticate("apple", { session: false }), authControllers.oauthCallback);

// Public routes
router.get("/referral/:code", authControllers.checkReferralCode);
router.post("/send-otp", validateRequest(sendOtpSchema), authControllers.sendOtp);
router.post("/verify-otp", validateRequest(verifyOtpSchema), authControllers.verifyOtp);
router.post("/register", uploadProfileImage, parseBodyData, validateRequest(registerSchema), authControllers.register);
router.post("/login", validateRequest(loginSchema), authControllers.login);
router.post("/admin-login", validateRequest(loginSchema), authControllers.adminLogin);
router.post("/refresh-token", authControllers.refreshAccessToken);
router.post("/forgot-password", validateRequest(requestPasswordResetSchema), authControllers.requestPasswordReset);
router.post("/reset-password", validateRequest(resetPasswordSchema), authControllers.resetPassword);

// Protected routes (require auth)
router.get("/me", auth, authControllers.getMe);
router.get("/my-referrals", auth, authControllers.getMyReferrals);
router.post("/logout", auth, authControllers.logout);
router.patch("/profile", auth, uploadProfileImage, parseBodyData, validateRequest(updateProfileSchema), authControllers.updateProfile);
router.post("/change-password", auth, validateRequest(changePasswordSchema), authControllers.changePassword);
router.post("/add-fcm-token", auth, authControllers.addFCMToken);

// Admin only routes
router.post("/set-password/:userId", auth, authControllers.setUserPassword);
router.get("/all-referrals", auth, authorize(["ADMIN"]), authControllers.getAllReferrals);

export const authRoutes = router;
