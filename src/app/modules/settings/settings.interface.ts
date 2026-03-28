export type Currency = "XOF" | "EUR" | "USD" | "GBP";

export interface IPlatformSettings {
    payment: {
        commissionRate: number; // %
        escrowDuration: number; // hours
    };

    currency: {
        primary: Currency;
        supported: Currency[];
    };

    location: {
        countries: string[];
        cities: string[];
    };

    notifications: {
        email: boolean;
        push: boolean;
    };

    updatedAt?: Date;
}
