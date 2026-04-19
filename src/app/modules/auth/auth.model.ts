import mongoose, { Schema } from "mongoose";
import { User } from "./auth.interface";

const UserSchema = new Schema<User>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },

        email: {
            type: String,
            lowercase: true,
            trim: true,
            match: [/.+\@.+\..+/, "Please enter a valid email address"],
        },

        password: {
            type: String,
            required: [true, "Password is required"],
        },

        role: {
            type: String,
            enum: ["USER", "ADMIN"],
            default: "USER",
            required: true,
        },

        phone: {
            type: String,
            required: [true, "Phone is required"],
            unique: true,
        },

        photo: {
            type: String,
        },

        location: {
            lat: { type: Number },
            lng: { type: Number },
        },

        language: {
            type: String,
        },

        address: {
            fullName: String,
            country: String,
            addressLine1: String,
            addressLine2: String,
            postcode: String,
            city: String,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        isPhoneVerified: {
            type: Boolean,
            default: false,
        },

        lastLogin: {
            type: Date,
        },

        resetPasswordOtp: String,
        resetPasswordOtpExpiry: Date,
        resetPasswordToken: String,
        resetPasswordTokenExpiry: Date,

        phoneVerificationOtp: String,
        phoneVerificationExpiry: Date,

        // Referral fields
        referralCode: {
            type: String,
            unique: true,
        },
        referredBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        balance: {
            type: Number,
            default: 0,
            min: [0, "Balance cannot be negative"],
        },
    },
    {
        timestamps: true,
        versionKey: false,

        toJSON: {
            transform(doc, ret: Partial<User>) {
                delete ret.password;
                delete ret.resetPasswordOtp;
                delete ret.resetPasswordOtpExpiry;
                delete ret.resetPasswordToken;
                delete ret.resetPasswordTokenExpiry;
                delete ret.phoneVerificationOtp;
                delete ret.phoneVerificationExpiry;
                return ret;
            },
        },
    },
);

// Pre-save hook to generate unique referral code
UserSchema.pre("save", async function () {
    if (this.isNew && !this.referralCode) {
        // Generate a random 8-character uppercase alphanumeric code
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 8; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        this.referralCode = code;
    }
});

/*
|--------------------------------------------------------------------------
| Index Strategy (Production Safe)
|--------------------------------------------------------------------------
*/

// Authentication lookup
// UserSchema.index({ phone: 1 }, { unique: true });

UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

UserSchema.index({ isPhoneVerified: 1 });

// Token lookup indexes (important for auth flows)
UserSchema.index({ resetPasswordToken: 1 });
UserSchema.index({ phoneVerificationOtp: 1 });

// Activity tracking optimization
UserSchema.index({ lastLogin: -1 });

// Referral and search indexes
UserSchema.index({ name: "text" });

export const UserModel = mongoose.model<User>("User", UserSchema);
