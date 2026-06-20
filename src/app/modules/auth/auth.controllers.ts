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
        message: "Utilisateur enregistré avec succès",
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
        message: "Connexion réussie",
        data: {
            user: result.user,
            accessToken: result.accessToken,
        },
    });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
    const user = await authServices.getUserById(req.user!._id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Utilisateur récupéré avec succès",
        data: user,
    });
});

const logout = catchAsync(async (req: Request, res: Response) => {
    res.clearCookie("refreshToken");

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Déconnexion réussie",
        data: null,
    });
});

const refreshAccessToken = catchAsync(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    const result = await authServices.refreshAccessToken(refreshToken);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Jeton actualisé avec succès",
        data: result,
    });
});

const requestPasswordReset = catchAsync(async (req: Request, res: Response) => {
    const { phone } = req.body;
    await authServices.requestPasswordReset(phone);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "OTP de réinitialisation du mot de passe envoyé au téléphone",
        data: null,
    });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const { phone, otp, newPassword } = req.body;
    await authServices.resetPassword(phone, otp, newPassword);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Réinitialisation du mot de passe réussie",
        data: null,
    });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const body = req.body;

    // Handle photo upload if present (path is already set by uploadProfileImage middleware)
    if (req.file) {
        body.photo = req.file.path;
    }

    const updatedUser = await authServices.updateProfile(userId, body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Profil mis à jour avec succès",
        data: updatedUser,
    });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
    await authServices.changePassword(req.user!._id, req.body.currentPassword, req.body.newPassword);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Mot de passe changé avec succès",
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
        message: "Mot de passe défini avec succès",
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
        message: "Connexion administrateur réussie",
        data: {
            user: result.user,
            accessToken: result.accessToken,
        },
    });
});

const addFCMToken = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const { token } = req.body;
    const result = await authServices.addFCMToken(userId, token);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const removeFCMToken = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const { token } = req.body;
    const result = await authServices.removeFCMToken(userId, token);

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
        message: user ? "Code de parrainage valide" : "Code de parrainage invalide",
        data: {
            valid: !!user,
            referralCode: code,
            referrerName: user?.name || null,
        },
    });
});

const getMyReferrals = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const result = await authServices.getMyReferrals(userId, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Parrainages récupérés avec succès",
        meta: result.meta,
        data: result.data,
    });
});

const getAllReferrals = catchAsync(async (req: Request, res: Response) => {
    const result = await authServices.getAllReferrals(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Tous les parrainages récupérés avec succès",
        meta: result.meta,
        data: result.data,
    });
});

const completeOAuthRegistration = catchAsync(async (req: Request, res: Response) => {
    const result = await authServices.oauthLoginSignup(req.body);

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Inscription réussie",
        data: {
            user: result.user,
            accessToken: result.accessToken,
        },
    });
});

const oauthCallback = catchAsync(async (req: Request, res: Response) => {
    const userOrTemp = req.authUser as any;
    const redirectUri = req.query.redirect_uri as string;
    const referralCode = req.query.referral_code as string;

    if (userOrTemp?.isTemp) {
        const tempData = {
            isNewUser: true,
            requiresPhonePassword: true,
            tempUser: {
                provider: userOrTemp.provider,
                providerId: userOrTemp.providerId,
                email: userOrTemp.email,
                name: userOrTemp.name,
                photo: userOrTemp.photo,
                referralCode,
            },
        };

        if (redirectUri) {
            const encodedData = encodeURIComponent(JSON.stringify(tempData));
            return res.redirect(`${redirectUri}?data=${encodedData}`);
        }

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Veuillez compléter votre inscription avec votre téléphone et votre mot de passe",
            data: tempData,
        });
    }

    const result = await authServices.oauthLoginSignup({
        provider: userOrTemp.oauthProvider,
        providerId: userOrTemp.oauthId,
        email: userOrTemp.email,
        name: userOrTemp.name,
        photo: userOrTemp.photo,
        referralCode,
    });

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const responseData = {
        user: result.user,
        accessToken: result.accessToken,
    };

    if (redirectUri) {
        const encodedData = encodeURIComponent(JSON.stringify(responseData));
        return res.redirect(`${redirectUri}?data=${encodedData}`);
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.isNewUser ? "Inscription réussie" : "Connexion réussie",
        data: responseData,
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
    removeFCMToken,
    checkReferralCode,
    getMyReferrals,
    getAllReferrals,
    oauthCallback,
    completeOAuthRegistration,
};
