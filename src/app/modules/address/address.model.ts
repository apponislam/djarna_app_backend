import { Schema, model } from "mongoose";
import { IShippingAddress } from "./address.interface";

const shippingAddressSchema = new Schema<IShippingAddress>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        country: {
            type: String,
            required: true,
            trim: true,
        },
        addressLine1: {
            type: String,
            required: true,
            trim: true,
        },
        addressLine2: {
            type: String,
            trim: true,
        },
        postcode: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
);

// Deep indexing for performance
shippingAddressSchema.index({ user: 1 });
shippingAddressSchema.index({ user: 1, isDefault: 1, isDeleted: 1 });
shippingAddressSchema.index({ postcode: 1 });
shippingAddressSchema.index({ city: 1 });
shippingAddressSchema.index({ country: 1 });

export const ShippingAddressModel = model<IShippingAddress>("ShippingAddress", shippingAddressSchema);
