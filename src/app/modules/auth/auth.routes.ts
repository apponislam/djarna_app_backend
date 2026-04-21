import { Router } from "express";
import { authControllers } from "./auth.controllers";
import validateRequest from "../../middlewares/validateRequest";
import { changePasswordSchema, loginSchema, sendOtpSchema, verifyOtpSchema, requestPasswordResetSchema, resetPasswordSchema, registerSchema, updateProfileSchema } from "./auth.validations";
import auth from "../../middlewares/auth";
import { parseBodyData, uploadProfileImage } from "../../middlewares/multer";

const router = Router();

// Public routes
router.post("/send-otp", validateRequest(sendOtpSchema), authControllers.sendOtp);
router.post("/verify-otp", validateRequest(verifyOtpSchema), authControllers.verifyOtp);
router.post("/register", uploadProfileImage, parseBodyData, validateRequest(registerSchema), authControllers.register);
router.post("/login", validateRequest(loginSchema), authControllers.login);
router.post("/refresh-token", authControllers.refreshAccessToken);
router.post("/forgot-password", validateRequest(requestPasswordResetSchema), authControllers.requestPasswordReset);
router.post("/reset-password", validateRequest(resetPasswordSchema), authControllers.resetPassword);

// Protected routes (require auth)
router.get("/me", auth, authControllers.getMe);
router.post("/logout", auth, authControllers.logout);
router.patch("/profile", auth, uploadProfileImage, parseBodyData, validateRequest(updateProfileSchema), authControllers.updateProfile);
router.post("/change-password", auth, validateRequest(changePasswordSchema), authControllers.changePassword);

// Admin only routes
router.post("/set-password/:userId", auth, authControllers.setUserPassword);

export const authRoutes = router;
