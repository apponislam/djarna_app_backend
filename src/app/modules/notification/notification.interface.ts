import { Types } from "mongoose";

// export type NotificationType = "ORDER_PLACED" | "ORDER_STATUS_UPDATE" | "ORDER_DELIVERED" | "ORDER_CANCELLED" | "PAYMENT_COMPLETED" | "WITHDRAWAL_REQUEST" | "WITHDRAWAL_COMPLETED" | "WITHDRAWAL_FAILED" | "PRODUCT_SOLD" | "PRODUCT_PROMOTED" | "FOLLOWED_YOU" | "NEW_MESSAGE" | "REVIEW_RECEIVED" | "DISPUTE_OPENED" | "DISPUTE_RESOLVED" | "REFUND_PROCESSED" | "SYSTEM";

export type NotificationType = 
    | "COMMANDE_PASSEE" 
    | "MISE_A_JOUR_STATUT_COMMANDE" 
    | "COMMANDE_LIVREE" 
    | "COMMANDE_ANNULEE" 
    | "PAIEMENT_EFFECTUE" 
    | "DEMANDE_DE_RETRAIT" 
    | "RETRAIT_EFFECTUE" 
    | "RETRAIT_ECHOUE" 
    | "PRODUIT_VENDU" 
    | "PRODUIT_MIS_EN_AVANT" 
    | "A_COMMENCE_A_VOUS_SUIVRE" 
    | "NOUVEAU_MESSAGE" 
    | "AVIS_RECU" 
    | "LITIGE_OUVERT" 
    | "LITIGE_RESOLU" 
    | "REMBOURSEMENT_TRAITE" 
    | "SYSTEME";

export interface INotification {
    user: Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    data?: Record<string, any>;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
