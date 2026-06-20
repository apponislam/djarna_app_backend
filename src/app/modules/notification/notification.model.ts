import { Schema, model } from "mongoose";
import { INotification } from "./notification.interface";

const NotificationSchema = new Schema<INotification>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["COMMANDE_PASSEE", "MISE_A_JOUR_STATUT_COMMANDE", "COMMANDE_LIVREE", "COMMANDE_ANNULEE", "PAIEMENT_EFFECTUE", "DEMANDE_DE_RETRAIT", "RETRAIT_EFFECTUE", "RETRAIT_ECHOUE", "PRODUIT_VENDU", "PRODUIT_MIS_EN_AVANT", "A_COMMENCE_A_VOUS_SUIVRE", "NOUVEAU_MESSAGE", "AVIS_RECU", "LITIGE_OUVERT", "LITIGE_RESOLU", "REMBOURSEMENT_TRAITE", "SYSTEME"],
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        data: {
            type: Schema.Types.Mixed,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// "ORDER_PLACED",
// "ORDER_STATUS_UPDATE",
// "ORDER_DELIVERED",
// "ORDER_CANCELLED",
// "PAYMENT_COMPLETED",
// "WITHDRAWAL_REQUEST",
// "WITHDRAWAL_COMPLETED",
// "WITHDRAWAL_FAILED",
// "PRODUCT_SOLD",
// "PRODUCT_PROMOTED",
// "FOLLOWED_YOU",
// "NEW_MESSAGE",
// "REVIEW_RECEIVED",
// "DISPUTE_OPENED",
// "DISPUTE_RESOLVED",
// "REFUND_PROCESSED",
// "SYSTEM"

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });

export const NotificationModel = model<INotification>("Notification", NotificationSchema);
