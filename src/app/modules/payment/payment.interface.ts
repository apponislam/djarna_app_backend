export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";

export type PaymentMethod = "PAYDUNYA" | "CARD" | "MOBILE_MONEY" | "WALLET";

export type Currency = "FCFA" | "USD" | "EUR";

export interface IPayment {
    userId: string;
    amount: number;
    currency: Currency;
    status: PaymentStatus;
    method: PaymentMethod;
    transactionId?: string;
    paydunyaInvoiceToken?: string;
    paydunyaReceiptUrl?: string;
    description?: string;
    metadata?: Record<string, any>;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
