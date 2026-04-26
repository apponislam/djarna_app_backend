export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";

export type PaymentMethod = "PAYDUNYA" | "CARD" | "MOBILE_MONEY" | "WALLET" | "APPLE_PAY" | "GOOGLE_PAY";

export type Currency = "FCFA" | "USD" | "EUR";

export interface IPayment {
    userId: string;
    amount: number; // Total amount paid by buyer
    productPrice?: number; // Base product price
    buyerFee?: number; // Total buyer protection fee (fixed + %)
    siteFee?: number; // Site commission (deducted from seller payout)
    shippingFee?: number; // Shipping cost
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
