import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { jwtHelper } from "../../../utils/jwtHelper";
import config from "../../config";
import { UserModel } from "./auth.model";
import { VerificationModel } from "./verification.model";
import { ProductModel } from "../product/product.model";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendVerificationCode, checkVerificationCode } from "../../../utils/twilioHelper";
import { normalizePhoneNumber } from "../../../utils/phoneHelper";
import mongoose from "mongoose";
import { FollowModel } from "../follow/follow.model";
import { ActivityService } from "../activity/activity.services";

const sendRegistrationOtp = async (phone: string, referralCode?: string) => {
    const normalizedPhone = normalizePhoneNumber(phone);

    // Check if user already exists
    const existingUser = await UserModel.findOne({ phone: normalizedPhone });
    if (existingUser) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Ce numéro de téléphone est déjà inscrit");
    }

    // Send SMS verification via Twilio Verify
    await sendVerificationCode(normalizedPhone);

    // Upsert verification record (to track verification state and referral code)
    await VerificationModel.findOneAndUpdate(
        { phone: normalizedPhone },
        { isVerified: false, referralCode },
        { upsert: true, returnDocument: "after" }
    );

    return { message: "OTP envoyé avec succès" };
};

const verifyRegistrationOtp = async (phone: string, otp: string) => {
    const normalizedPhone = normalizePhoneNumber(phone);

    // Verify OTP code via Twilio Verify
    const isValid = await checkVerificationCode(normalizedPhone, otp);
    if (!isValid) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Code OTP invalide ou expiré");
    }

    const verification = await VerificationModel.findOne({ phone: normalizedPhone });
    if (!verification) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Aucune demande d'OTP trouvée pour ce numéro");
    }

    verification.isVerified = true;
    await verification.save();

    return { message: "OTP vérifié avec succès" };
};

const registerUser = async (data: any) => {
    const normalizedPhone = normalizePhoneNumber(data.phone);

    // Check if phone was verified
    const verification = await VerificationModel.findOne({ phone: normalizedPhone });
    if (!verification || !verification.isVerified) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Numéro de téléphone non vérifié. Veuillez d'abord vérifier le code OTP.");
    }

    const { referralCode: inputReferralCode, ...rest } = data;
    delete (rest as any).balance;
    delete (rest as any).noCommission;
    const referralCode = inputReferralCode || verification.referralCode;

    // Double check existing user
    const existing = await UserModel.findOne({ phone: normalizedPhone });
    if (existing) throw new ApiError(httpStatus.BAD_REQUEST, "Ce numéro de téléphone est déjà utilisé");

    // Handle referral logic
    let referredBy;
    if (referralCode) {
        const referrer = await UserModel.findOne({ referralCode });
        if (referrer) {
            referredBy = referrer._id;
            // Increase referrer's noCommission
            await UserModel.updateOne({ _id: referrer._id }, { $inc: { noCommission: 1 } });
        }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(rest.password, Number(config.bcrypt_salt_rounds));

    // Create user
    const userData = {
        ...rest,
        phone: normalizedPhone,
        referredBy,
        password: hashedPassword,
        isActive: true,
        isPhoneVerified: true,
    };

    const createdUser = await UserModel.create(userData);

    // Log activity
    ActivityService.logActivity(createdUser._id.toString(), "REGISTER", "Compte enregistré avec succès");

    // Delete verification record
    await VerificationModel.deleteOne({ phone: normalizedPhone });

    // Generate tokens
    const jwtPayload = {
        _id: createdUser._id,
        name: createdUser.name,
        phone: createdUser.phone,
        role: createdUser.role,
    };

    const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);
    const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret as string, config.jwt_refresh_expire as string);

    const userObject = createdUser.toObject();
    const { password: pwd, ...userWithoutSensitive } = userObject;

    return { user: userWithoutSensitive, accessToken, refreshToken };
};

const loginUser = async (data: { phone: string; password: string }) => {
    const normalizedPhone = normalizePhoneNumber(data.phone);

    // Find user
    const user = await UserModel.findOne({ phone: normalizedPhone });
    if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "Le numéro de téléphone ou le mot de passe est incorrect");

    // Check password
    const isPasswordValid = await bcrypt.compare(data.password, user.password as string);
    if (!isPasswordValid) throw new ApiError(httpStatus.UNAUTHORIZED, "Le numéro de téléphone ou le mot de passe est incorrect");

    // Check if active
    if (!user.isActive) throw new ApiError(httpStatus.FORBIDDEN, "Ce compte est désactivé");

    // Update last login
    await UserModel.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    // Log activity
    ActivityService.logActivity(user._id.toString(), "LOGIN", "Utilisateur connecté avec succès");

    // Generate tokens
    const jwtPayload = {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
    };

    const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);
    const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret as string, config.jwt_refresh_expire as string);

    const { password, ...userWithoutPassword } = user.toObject();

    return { user: userWithoutPassword, accessToken, refreshToken };
};

const getUserById = async (userId: string) => {
    const user = await UserModel.findById(userId).select("-password");
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Utilisateur introuvable");
    return user;
};

const refreshAccessToken = async (refreshToken: string) => {
    console.log(refreshToken);
    if (!refreshToken) throw new ApiError(httpStatus.UNAUTHORIZED, "Jeton d'actualisation requis");

    try {
        const decoded = jwtHelper.verifyToken(refreshToken, config.jwt_refresh_secret as string);

        const user = await UserModel.findById(decoded._id).select("-password");
        if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "Utilisateur introuvable");

        const jwtPayload = {
            _id: user._id,
            name: user.name,
            phone: user.phone,
            role: user.role,
        };

        const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);

        return { user, accessToken };
    } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Jeton d'actualisation invalide");
    }
};

const requestPasswordReset = async (phone: string) => {
    const normalizedPhone = normalizePhoneNumber(phone);
    const user = await UserModel.findOne({ phone: normalizedPhone });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Utilisateur introuvable");

    // Send password reset OTP via Twilio Verify
    await sendVerificationCode(normalizedPhone);

    return { message: "OTP envoyé avec succès" };
};

const resetPassword = async (phone: string, otp: string, newPassword: string) => {
    const normalizedPhone = normalizePhoneNumber(phone);
    const user = await UserModel.findOne({ phone: normalizedPhone });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Utilisateur introuvable");

    // Verify OTP code via Twilio Verify
    const isValid = await checkVerificationCode(normalizedPhone, otp);
    if (!isValid) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Code OTP invalide ou expiré");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

    user.password = hashedPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;

    await user.save();

    return { message: "Réinitialisation du mot de passe réussie" };
};

const updateProfile = async (userId: string, data: any) => {
    delete data.balance;
    delete data.noCommission;
    if (data.phone) {
        data.phone = normalizePhoneNumber(data.phone);
    }
    const user = await UserModel.findByIdAndUpdate(userId, { $set: data }, { returnDocument: "after", runValidators: true }).select("-password");

    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Utilisateur introuvable");
    return user;
};

const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Utilisateur introuvable");

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password as string);
    if (!isPasswordValid) throw new ApiError(httpStatus.BAD_REQUEST, "Le mot de passe actuel est incorrect");

    const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));
    user.password = hashedPassword;
    await user.save();
};

const setUserPassword = async (userId: string, newPassword: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Utilisateur introuvable");

    const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));
    user.password = hashedPassword;
    await user.save();
};

const getMyProfile = async (userId: string) => {
    const user = await UserModel.findById(userId).populate("referredBy", "name email phone").lean();
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Utilisateur introuvable");

    const followersCount = await FollowModel.countDocuments({ following: userId });
    const followingCount = await FollowModel.countDocuments({ follower: userId });

    return {
        ...user,
        followersCount,
        followingCount,
    };
};

const boostShop = async (userId: string, boostPackId: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Utilisateur introuvable");

    const pack = await (mongoose.model("BoostPack") as any).findById(boostPackId);
    if (!pack || !pack.isActive || pack.type !== "SHOP") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Pack de boost de boutique invalide ou inactif");
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + pack.duration * 24 * 60 * 60 * 1000);

    // Apply boost to all active products of the user
    await ProductModel.updateMany(
        {
            user: userId,
            status: { $ne: "SOLD" },
            isDeleted: false,
        },
        {
            isBoosted: true,
            boostPack: pack._id,
            boostStartTime: now,
            boostEndTime: endTime,
        },
    );

    return { message: "Produits de la boutique boostés avec succès" };
};

const adminLogin = async (data: { phone: string; password: string }) => {
    const normalizedPhone = normalizePhoneNumber(data.phone);

    // Find user
    const user = await UserModel.findOne({ phone: normalizedPhone });
    if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "Le numéro de téléphone ou le mot de passe est incorrect");

    // Check if role is ADMIN
    if (user.role !== "ADMIN") {
        throw new ApiError(httpStatus.FORBIDDEN, "Accès refusé. Seuls les administrateurs peuvent se connecter ici.");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(data.password, user.password as string);
    if (!isPasswordValid) throw new ApiError(httpStatus.UNAUTHORIZED, "Le numéro de téléphone ou le mot de passe est incorrect");

    // Check if active
    if (!user.isActive) throw new ApiError(httpStatus.FORBIDDEN, "Ce compte est désactivé");

    // Update last login
    await UserModel.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    // Log activity
    ActivityService.logActivity(user._id.toString(), "LOGIN", "Administrateur connecté avec succès");

    // Generate tokens
    const jwtPayload = {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
    };

    const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);
    const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret as string, config.jwt_refresh_expire as string);

    const { password, ...userWithoutPassword } = user.toObject();

    return { user: userWithoutPassword, accessToken, refreshToken };
};

const addFCMToken = async (userId: string, token: string) => {
    // 1. Remove this token from any other users first (prevents cross-user notifications on the same device)
    await UserModel.updateMany({ fcmTokens: token }, { $pull: { fcmTokens: token } });

    // 2. Find the user
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Utilisateur introuvable");

    // 3. Update and clean up token array
    let updatedTokens = [...(user.fcmTokens || [])];
    
    // If the token already exists, remove it first so we can push it to the end (making it the most recent)
    const tokenIndex = updatedTokens.indexOf(token);
    if (tokenIndex > -1) {
        updatedTokens.splice(tokenIndex, 1);
    }
    
    // Push the current token to the end of the array
    updatedTokens.push(token);

    // Keep only the 10 most recent tokens (purges stale/old tokens automatically)
    if (updatedTokens.length > 10) {
        updatedTokens = updatedTokens.slice(-10);
    }

    user.fcmTokens = updatedTokens;
    await user.save();

    return { message: "Jeton FCM ajouté avec succès" };
};

const removeFCMToken = async (userId: string, token: string) => {
    const user = await UserModel.findByIdAndUpdate(userId, { $pull: { fcmTokens: token } }, { returnDocument: "after" });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Utilisateur introuvable");

    return { message: "Jeton FCM supprimé avec succès" };
};

const getUserByReferralCode = async (referralCode: string) => {
    const user = await UserModel.findOne({ referralCode });
    return user;
};

const getMyReferrals = async (userId: string, query: Record<string, any> = {}) => {
    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { referredBy: userId };

    const referrals = await UserModel.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    const total = await UserModel.countDocuments(filter);

    const totalPages = Math.ceil(total / Number(limit));
    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPage: totalPages,
            totalPages,
            hasNext: Number(page) < totalPages,
            hasPrev: Number(page) > 1,
        },
        data: referrals,
    };
};

const getAllReferrals = async (query: Record<string, any> = {}) => {
    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { referredBy: { $ne: null } };

    const referrals = await UserModel.find(filter).populate("referredBy", "name email phone referralCode").select("-password").sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    const total = await UserModel.countDocuments(filter);

    const totalPages = Math.ceil(total / Number(limit));
    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPage: totalPages,
            totalPages,
            hasNext: Number(page) < totalPages,
            hasPrev: Number(page) > 1,
        },
        data: referrals,
    };
};

const oauthLoginSignup = async (data: { provider: "GOOGLE" | "FACEBOOK" | "APPLE"; providerId: string; email?: string; name: string; photo?: string; phone?: string; password?: string; referralCode?: string }) => {
    // Try to find user by provider ID
    let user = await UserModel.findOne({ oauthProvider: data.provider, oauthId: data.providerId });

    if (user) {
        // User exists, log them in
        await UserModel.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });
        ActivityService.logActivity(user._id.toString(), "LOGIN", "Utilisateur connecté via OAuth");

        const jwtPayload = {
            _id: user._id,
            name: user.name,
            phone: user.phone,
            role: user.role,
        };

        const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);
        const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret as string, config.jwt_refresh_expire as string);

        const { password, ...userWithoutPassword } = user.toObject();
        return { user: userWithoutPassword, accessToken, refreshToken, isNewUser: false };
    }

    // If not found, check by email
    if (data.email) {
        user = await UserModel.findOne({ email: data.email });
        if (user) {
            // Link the OAuth provider to existing user
            user.oauthProvider = data.provider;
            user.oauthId = data.providerId;
            await user.save();

            await UserModel.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });
            ActivityService.logActivity(user._id.toString(), "LOGIN", "Utilisateur connecté via OAuth");

            const jwtPayload = {
                _id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role,
            };

            const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);
            const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret as string, config.jwt_refresh_expire as string);

            const { password, ...userWithoutPassword } = user.toObject();
            return { user: userWithoutPassword, accessToken, refreshToken, isNewUser: false };
        }
    }

    // Check if phone and password are provided (required for new user)
    if (!data.phone || !data.password) {
        return {
            isNewUser: true,
            requiresPhonePassword: true,
            tempUser: {
                name: data.name,
                email: data.email,
                photo: data.photo,
                provider: data.provider,
                providerId: data.providerId,
                referralCode: data.referralCode,
            },
        };
    }

    // Create new user
    const normalizedPhone = normalizePhoneNumber(data.phone);

    // Check if phone already exists
    const existingPhoneUser = await UserModel.findOne({ phone: normalizedPhone });
    if (existingPhoneUser) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Ce numéro de téléphone est déjà inscrit");
    }

    // Handle referral logic
    let referredBy;
    if (data.referralCode) {
        const referrer = await UserModel.findOne({ referralCode: data.referralCode });
        if (referrer) {
            referredBy = referrer._id;
            await UserModel.updateOne({ _id: referrer._id }, { $inc: { noCommission: 1 } });
        }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, Number(config.bcrypt_salt_rounds));

    // Create user
    const userData = {
        name: data.name,
        email: data.email,
        phone: normalizedPhone,
        password: hashedPassword,
        photo: data.photo,
        oauthProvider: data.provider,
        oauthId: data.providerId,
        referredBy,
        isActive: true,
        isPhoneVerified: true,
    };

    const createdUser = await UserModel.create(userData);

    ActivityService.logActivity(createdUser._id.toString(), "REGISTER", "Compte enregistré via OAuth");

    const jwtPayload = {
        _id: createdUser._id,
        name: createdUser.name,
        phone: createdUser.phone,
        role: createdUser.role,
    };

    const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);
    const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret as string, config.jwt_refresh_expire as string);

    const { password: pwd, ...userWithoutSensitive } = createdUser.toObject();

    return { user: userWithoutSensitive, accessToken, refreshToken, isNewUser: true };
};

const deleteAccount = async (userId: string) => {
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "Utilisateur introuvable");
    }

    user.isActive = false;
    await user.save();

    // Pause all of the user's products
    await ProductModel.updateMany(
        { user: userId },
        { status: "PAUSED" }
    );

    return { message: "Compte supprimé avec succès et produits mis en pause" };
};

export const authServices = {
    sendRegistrationOtp,
    verifyRegistrationOtp,
    registerUser,
    loginUser,
    adminLogin,
    getUserById,
    refreshAccessToken,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    changePassword,
    setUserPassword,
    getMyProfile,
    boostShop,
    addFCMToken,
    removeFCMToken,
    getUserByReferralCode,
    getMyReferrals,
    getAllReferrals,
    oauthLoginSignup,
    deleteAccount,
};
