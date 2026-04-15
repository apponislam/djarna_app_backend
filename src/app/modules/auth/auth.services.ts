import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { jwtHelper } from "../../../utils/jwtHelper";
import config from "../../config";
import { UserModel } from "./auth.model";
import { VerificationModel } from "./verification.model";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendSms } from "../../../utils/twilioHelper";
import { normalizePhoneNumber } from "../../../utils/phoneHelper";

const sendRegistrationOtp = async (phone: string, referralCode?: string) => {
    const normalizedPhone = normalizePhoneNumber(phone);

    // Check if user already exists
    const existingUser = await UserModel.findOne({ phone: normalizedPhone });
    if (existingUser) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Phone number already registered");
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert verification record
    await VerificationModel.findOneAndUpdate({ phone: normalizedPhone }, { otp, expiry, isVerified: false, referralCode }, { upsert: true, new: true });

    // Send SMS
    await sendSms(normalizedPhone, `Your verification code is: ${otp}. Valid for 10 minutes.`);

    // Log for development
    console.log(`Registration OTP for ${normalizedPhone}: ${otp}`);

    return { message: "OTP sent successfully" };
};

const verifyRegistrationOtp = async (phone: string, otp: string) => {
    const normalizedPhone = normalizePhoneNumber(phone);
    const verification = await VerificationModel.findOne({ phone: normalizedPhone });

    if (!verification) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No OTP request found for this number");
    }

    if (verification.expiry < new Date()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "OTP expired");
    }

    if (verification.otp !== otp) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
    }

    verification.isVerified = true;
    await verification.save();

    return { message: "OTP verified successfully" };
};

const registerUser = async (data: any) => {
    const normalizedPhone = normalizePhoneNumber(data.phone);

    // Check if phone was verified
    const verification = await VerificationModel.findOne({ phone: normalizedPhone });
    if (!verification || !verification.isVerified) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Phone number not verified. Please verify OTP first.");
    }

    const { referralCode: inputReferralCode, ...rest } = data;
    const referralCode = inputReferralCode || verification.referralCode;

    // Double check existing user
    const existing = await UserModel.findOne({ phone: normalizedPhone });
    if (existing) throw new ApiError(httpStatus.BAD_REQUEST, "Phone number already in use");

    // Handle referral logic
    let referredBy;
    if (referralCode) {
        const referrer = await UserModel.findOne({ referralCode });
        if (referrer) {
            referredBy = referrer._id;
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
    if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");

    // Check password
    const isPasswordValid = await bcrypt.compare(data.password, user.password as string);
    if (!isPasswordValid) throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");

    // Check if active
    if (!user.isActive) throw new ApiError(httpStatus.FORBIDDEN, "Account is deactivated");

    // Update last login
    await UserModel.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

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
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    return user;
};

const refreshAccessToken = async (refreshToken: string) => {
    console.log(refreshToken);
    if (!refreshToken) throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token required");

    try {
        const decoded = jwtHelper.verifyToken(refreshToken, config.jwt_refresh_secret as string);

        const user = await UserModel.findById(decoded._id).select("-password");
        if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "User not found");

        const jwtPayload = {
            _id: user._id,
            name: user.name,
            phone: user.phone,
            role: user.role,
        };

        const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);

        return { user, accessToken };
    } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
    }
};

const requestPasswordReset = async (phone: string) => {
    const normalizedPhone = normalizePhoneNumber(phone);
    const user = await UserModel.findOne({ phone: normalizedPhone });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = otpExpiry;
    await user.save();

    // Send SMS
    await sendSms(normalizedPhone, `Your password reset code is: ${otp}. Valid for 5 minutes.`);

    // Log for development
    console.log(`Password Reset OTP for ${normalizedPhone}: ${otp}`);

    return { message: "OTP sent successfully" };
};

const resetPassword = async (phone: string, otp: string, newPassword: string) => {
    const normalizedPhone = normalizePhoneNumber(phone);
    const user = await UserModel.findOne({ phone: normalizedPhone });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No OTP request found");
    }

    if (user.resetPasswordOtpExpiry < new Date()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "OTP expired");
    }

    if (user.resetPasswordOtp !== otp) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

    user.password = hashedPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;

    await user.save();

    return { message: "Password reset successful" };
};

const updateProfile = async (userId: string, data: any) => {
    if (data.phone) {
        data.phone = normalizePhoneNumber(data.phone);
    }
    const user = await UserModel.findByIdAndUpdate(userId, { $set: data }, { new: true, runValidators: true }).select("-password");

    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    return user;
};

const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password as string);
    if (!isPasswordValid) throw new ApiError(httpStatus.BAD_REQUEST, "Current password is incorrect");

    const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));
    user.password = hashedPassword;
    await user.save();
};

const setUserPassword = async (userId: string, newPassword: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

    const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));
    user.password = hashedPassword;
    await user.save();
};

export const authServices = {
    sendRegistrationOtp,
    verifyRegistrationOtp,
    registerUser,
    loginUser,
    getUserById,
    refreshAccessToken,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    changePassword,
    setUserPassword,
};
