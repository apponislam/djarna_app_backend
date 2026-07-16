import { Schema, model } from "mongoose";
import { IBlock } from "./block.interface";

const blockSchema = new Schema<IBlock>(
    {
        blocker: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        blocked: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Prevent duplicate blocks
blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });
blockSchema.index({ blocker: 1 });
blockSchema.index({ blocked: 1 });

export const BlockModel = model<IBlock>("Block", blockSchema);
