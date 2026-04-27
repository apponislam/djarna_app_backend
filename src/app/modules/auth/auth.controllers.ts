import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import config from "../../config";
import { Request, Response } from "express";
import { authServices } from "./auth.services";

const sendOtp = catchAsync(async (req: Request, res: Response) => {
    const { phone, referralCode } = req.body;
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
    const user = await authServices.getUserById(req.user._id);

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
    const userId = req.user._id;
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
    await authServices.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);

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
};
