import { Types } from "mongoose";

export interface Conversation {
    participantIds: Types.ObjectId[];
    lastMessage?: Types.ObjectId;
    productId?: Types.ObjectId;
    unreadCounts: {
        userId: Types.ObjectId;
        count: number;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

export type MessageType = "MESSAGE" | "LOCATION" | "OFFER" | "ACCEPTED" | "REJECTED" | "COMPLETED";

export interface MessageFile {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
}

export interface Message {
    conversationId: Types.ObjectId;
    senderId: Types.ObjectId;
    type: MessageType;
    text?: string;
    files?: MessageFile[];
    productId?: Types.ObjectId;
    offerPrice?: number;
    location?: {
        fullAddress?: string;
        latitude?: number;
        longitude?: number;
        updatedAt?: Date;
    };
    isEdited: boolean;
    editedAt?: Date;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
