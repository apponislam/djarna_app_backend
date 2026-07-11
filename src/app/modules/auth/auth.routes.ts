import { Router } from "express";
import { authControllers } from "./auth.controllers";
import validateRequest from "../../middlewares/validateRequest";
import { changePasswordSchema, loginSchema, sendOtpSchema, verifyOtpSchema, requestPasswordResetSchema, resetPasswordSchema, registerSchema, updateProfileSchema, completeOAuthRegistrationSchema } from "./auth.validations";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { parseBodyData, uploadProfileImage } from "../../middlewares/multer";
import passport from "../../../utils/passport";

const router = Router();

// ==================== OAuth Routes ====================
// Complete OAuth Registration
router.post("/oauth/complete", validateRequest(completeOAuthRegistrationSchema), authControllers.completeOAuthRegistration);

// Google
router.get("/google", (req, res, next) => {
    const redirectUri = req.query.redirect_uri;
    const referralCode = req.query.referral_code;
    const stateData = {
        redirectUri,
        referralCode,
    };
    const state = encodeURIComponent(JSON.stringify(stateData));
    passport.authenticate("google", {
        scope: ["profile", "email"],
        state,
    })(req, res, next);
});
router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }),
    (req, res, next) => {
        req.authUser = req.user;
        req.user = undefined;
        if (req.query.state) {
            try {
                const stateData = JSON.parse(decodeURIComponent(req.query.state as string));
                req.query.redirect_uri = stateData.redirectUri;
                req.query.referral_code = stateData.referralCode;
            } catch {
                req.query.redirect_uri = decodeURIComponent(req.query.state as string);
            }
        }
        next();
    },
    authControllers.oauthCallback,
);

// Facebook
router.get("/facebook", (req, res, next) => {
    const redirectUri = req.query.redirect_uri;
    const referralCode = req.query.referral_code;
    const stateData = {
        redirectUri,
        referralCode,
    };
    const state = encodeURIComponent(JSON.stringify(stateData));
    passport.authenticate("facebook", {
        scope: ["email"],
        state,
    })(req, res, next);
});
router.get(
    "/facebook/callback",
    passport.authenticate("facebook", { session: false }),
    (req, res, next) => {
        req.authUser = req.user;
        req.user = undefined;
        if (req.query.state) {
            try {
                const stateData = JSON.parse(decodeURIComponent(req.query.state as string));
                req.query.redirect_uri = stateData.redirectUri;
                req.query.referral_code = stateData.referralCode;
            } catch {
                req.query.redirect_uri = decodeURIComponent(req.query.state as string);
            }
        }
        next();
    },
    authControllers.oauthCallback,
);

// Apple
router.get("/apple", (req, res, next) => {
    const redirectUri = req.query.redirect_uri;
    const referralCode = req.query.referral_code;
    const stateData = {
        redirectUri,
        referralCode,
    };
    const state = encodeURIComponent(JSON.stringify(stateData));
    passport.authenticate("apple", {
        scope: ["email", "name"],
        state,
    })(req, res, next);
});
router.post(
    "/apple/callback",
    passport.authenticate("apple", { session: false }),
    (req, res, next) => {
        req.authUser = req.user;
        req.user = undefined;
        if (req.body.state) {
            try {
                const stateData = JSON.parse(decodeURIComponent(req.body.state as string));
                req.query.redirect_uri = stateData.redirectUri;
                req.query.referral_code = stateData.referralCode;
            } catch {
                req.query.redirect_uri = decodeURIComponent(req.body.state as string);
            }
        }
        next();
    },
    authControllers.oauthCallback,
);

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
router.post("/remove-fcm-token", auth, authControllers.removeFCMToken);

// Admin only routes
router.post("/set-password/:userId", auth, authorize(["ADMIN"]), authControllers.setUserPassword);
router.get("/all-referrals", auth, authorize(["ADMIN"]), authControllers.getAllReferrals);

export const authRoutes = router;
