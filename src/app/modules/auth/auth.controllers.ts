import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import config from "../../config";
import { Request, Response } from "express";
import { authServices } from "./auth.services";
import { UserModel } from "./auth.model";
import { jwtHelper } from "../../../utils/jwtHelper";

const sendOtp = catchAsync(async (req: Request, res: Response) => {
    const { phone, referralCode } = req.body;
    console.log(req.body);
    const result = await authServices.sendRegistrationOtp(phone, referralCode);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
    const { phone, otp } = req.body;
    const result = await authServices.verifyRegistrationOtp(phone, otp);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const register = catchAsync(async (req: Request, res: Response) => {
    const body = req.body;

    // Handle photo upload if present (path is already set by uploadProfileImage middleware)
    if (req.file) {
        body.photo = req.file.path;
    }

    const result = await authServices.registerUser(body);

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "User registered successfully",
        data: {
            user: result.user,
            accessToken: result.accessToken,
        },
    });
});

const login = catchAsync(async (req: Request, res: Response) => {
    const result = await authServices.loginUser(req.body);

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Login successful",
        data: {
            user: result.user,
            accessToken: result.accessToken,
        },
    });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
    const user = await authServices.getUserById((req as any).user._id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User retrieved successfully",
        data: user,
    });
});

const logout = catchAsync(async (req: Request, res: Response) => {
    res.clearCookie("refreshToken");

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Logout successful",
        data: null,
    });
});

const refreshAccessToken = catchAsync(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    const result = await authServices.refreshAccessToken(refreshToken);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Token refreshed successfully",
        data: result,
    });
});

const requestPasswordReset = catchAsync(async (req: Request, res: Response) => {
    const { phone } = req.body;
    await authServices.requestPasswordReset(phone);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password reset OTP sent to phone",
        data: null,
    });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const { phone, otp, newPassword } = req.body;
    await authServices.resetPassword(phone, otp, newPassword);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password reset successful",
        data: null,
    });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const body = req.body;

    // Handle photo upload if present (path is already set by uploadProfileImage middleware)
    if (req.file) {
        body.photo = req.file.path;
    }

    const updatedUser = await authServices.updateProfile(userId, body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
    });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
    await authServices.changePassword((req as any).user._id, req.body.currentPassword, req.body.newPassword);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password changed successfully",
        data: null,
    });
});

const setUserPassword = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const { password } = req.body;
    await authServices.setUserPassword(userId, password);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password set successfully",
        data: null,
    });
});

const adminLogin = catchAsync(async (req: Request, res: Response) => {
    const result = await authServices.adminLogin(req.body);

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin login successful",
        data: {
            user: result.user,
            accessToken: result.accessToken,
        },
    });
});

const addFCMToken = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { token } = req.body;
    const result = await authServices.addFCMToken(userId, token);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const checkReferralCode = catchAsync(async (req: Request, res: Response) => {
    const { code } = req.params;

    // Check if referral code exists
    const user = await authServices.getUserByReferralCode(code as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: user ? "Referral code valid" : "Referral code invalid",
        data: {
            valid: !!user,
            referralCode: code,
            referrerName: user?.name || null,
        },
    });
});

const getMyReferrals = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const result = await authServices.getMyReferrals(userId, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Referrals retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getAllReferrals = catchAsync(async (req: Request, res: Response) => {
    const result = await authServices.getAllReferrals(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All referrals retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const oauthCallback = catchAsync(async (req: Request, res: Response) => {
    console.log("[OAuth Callback] Starting OAuth callback");
    console.log("[OAuth Callback] req.user:", (req as any).user);
    console.log("[OAuth Callback] req.authInfo:", (req as any).authInfo);

    if (!(req as any).user) {
        const tempData = (req as any).authInfo?.tempData;
        console.log("[OAuth Callback] No user found, tempData:", tempData);

        if (tempData) {
            console.log("[OAuth Callback] Returning temp data for phone/password completion");
            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Please complete your signup with phone and password",
                data: {
                    isNewUser: true,
                    requiresPhonePassword: true,
                    tempUser: tempData,
                },
            });
        }

        console.log("[OAuth Callback] OAuth authentication failed");
        return sendResponse(res, {
            statusCode: httpStatus.UNAUTHORIZED,
            success: false,
            message: "OAuth authentication failed",
            data: (req as any).authInfo,
        });
    }

    console.log("[OAuth Callback] User found, processing login");
    const userDoc = (req as any).user;
    const user = userDoc.toObject ? userDoc.toObject() : userDoc;
    console.log("[OAuth Callback] User data (plain object):", user);

    console.log("[OAuth Callback] Updating lastLogin");
    await UserModel.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    const jwtPayload = {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
    };
    console.log("[OAuth Callback] JWT payload:", jwtPayload);

    const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);
    const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret as string, config.jwt_refresh_expire as string);
    console.log("[OAuth Callback] Tokens generated");

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    console.log("[OAuth Callback] Refresh token cookie set");

    const { password, __v, ...userWithoutPassword } = user;
    console.log("[OAuth Callback] Sending response with user:", userWithoutPassword);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Login successful",
        data: {
            user: userWithoutPassword,
            accessToken,
        },
    });
});

export const authControllers = {
    sendOtp,
    verifyOtp,
    register,
    login,
    adminLogin,
    getMe,
    logout,
    refreshAccessToken,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    changePassword,
    setUserPassword,
    addFCMToken,
    checkReferralCode,
    getMyReferrals,
    getAllReferrals,
    oauthCallback,
};
