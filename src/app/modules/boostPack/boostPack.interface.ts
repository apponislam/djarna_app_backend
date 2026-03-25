export type BoostVisibility = "MEDIUM" | "HIGH";

export interface IBoostPack {
    name: string;
    duration: number; // in days
    listingsCount: number; // number of listings that can be boosted
    visibility: BoostVisibility;
    price: number;
    currency: string; // default "FCFA"
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
