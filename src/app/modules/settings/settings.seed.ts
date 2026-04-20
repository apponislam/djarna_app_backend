import { SettingsModel } from "./settings.model";

export const seedSettings = async () => {
    try {
        const settingsCount = await SettingsModel.countDocuments();

        if (settingsCount === 0) {
            console.log("📝 No platform settings found, initializing default settings...");

            const defaultSettings = {
                payment: {
                    commissionRate: 10,
                    escrowDuration: 7,
                },
                notifications: {
                    email: true,
                    push: true,
                },
            };

            await SettingsModel.create(defaultSettings);

            console.log("✅ Platform settings initialized successfully.");
        } else {
            console.log("✅ Platform settings already exist, skipping initialization.");
        }
    } catch (error) {
        console.error("❌ Error seeding platform settings:", error);
    }
};
