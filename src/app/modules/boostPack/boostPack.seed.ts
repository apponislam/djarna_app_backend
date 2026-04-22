import { BoostPackModel } from "./boostPack.model";

export const seedBoostPacks = async () => {
    try {
        const boostPackCount = await BoostPackModel.countDocuments();

        if (boostPackCount === 0) {
            console.log("📝 No boost packs found, initializing default packs...");

            const defaultPacks = [
                // Product Boosts
                {
                    name: "Product Boost - 5 Days",
                    description: "Boost a single product for 5 days",
                    type: "PRODUCT",
                    duration: 5,
                    listingsCount: 1,
                    price: 1000,
                    currency: "FCFA",
                    isActive: true,
                },
                {
                    name: "Product Boost - 10 Days",
                    description: "Boost a single product for 10 days",
                    type: "PRODUCT",
                    duration: 10,
                    listingsCount: 1,
                    price: 2000,
                    currency: "FCFA",
                    isActive: true,
                },
                {
                    name: "Product Boost - 15 Days",
                    description: "Boost a single product for 15 days",
                    type: "PRODUCT",
                    duration: 15,
                    listingsCount: 1,
                    price: 3000,
                    currency: "FCFA",
                    isActive: true,
                    isRecommended: true,
                },
                {
                    name: "Product Boost - 30 Days",
                    description: "Boost a single product for 30 days",
                    type: "PRODUCT",
                    duration: 30,
                    listingsCount: 1,
                    price: 5000,
                    currency: "FCFA",
                    isActive: true,
                },

                // Shop Boosts
                {
                    name: "Shop Boost - 5 Days",
                    description: "Boost all products in your shop for 5 days",
                    type: "SHOP",
                    duration: 5,
                    listingsCount: 99999, // Represents all products
                    price: 3000,
                    currency: "FCFA",
                    isActive: true,
                },
                {
                    name: "Shop Boost - 10 Days",
                    description: "Boost all products in your shop for 10 days",
                    type: "SHOP",
                    duration: 10,
                    listingsCount: 99999,
                    price: 5000,
                    currency: "FCFA",
                    isActive: true,
                },
                {
                    name: "Shop Boost - 15 Days",
                    description: "Boost all products in your shop for 15 days",
                    type: "SHOP",
                    duration: 15,
                    listingsCount: 99999,
                    price: 7000,
                    currency: "FCFA",
                    isActive: true,
                    isRecommended: true,
                },
                {
                    name: "Shop Boost - 30 Days",
                    description: "Boost all products in your shop for 30 days",
                    type: "SHOP",
                    duration: 30,
                    listingsCount: 99999,
                    price: 12000,
                    currency: "FCFA",
                    isActive: true,
                },
            ];

            await BoostPackModel.insertMany(defaultPacks);

            console.log("✅ Boost packs initialized successfully.");
        } else {
            console.log("✅ Boost packs already exist, skipping initialization.");
        }
    } catch (error) {
        console.error("❌ Error seeding boost packs:", error);
    }
};
