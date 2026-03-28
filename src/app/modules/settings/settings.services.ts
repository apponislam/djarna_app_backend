import { IPlatformSettings } from "./settings.interface";
import { SettingsModel } from "./settings.model";

/**
 * Get current platform settings. 
 * If no settings exist, create a default one.
 */
const getSettings = async () => {
    let settings = await SettingsModel.findOne();

    if (!settings) {
        settings = await SettingsModel.create({
            payment: { commissionRate: 8, escrowDuration: 72 },
            currency: { primary: "XOF", supported: ["XOF"] },
            location: { countries: ["France"], cities: ["Paris"] },
            notifications: { email: true, push: true },
        });
    }

    return settings;
};

/**
 * Update platform settings (singleton).
 */
const updateSettings = async (payload: Partial<IPlatformSettings>) => {
    let settings = await SettingsModel.findOne();

    if (!settings) {
        settings = await SettingsModel.create(payload);
    } else {
        settings = await SettingsModel.findByIdAndUpdate(
            settings._id,
            { $set: payload },
            { new: true, runValidators: true }
        );
    }

    return settings;
};

export const SettingsService = {
    getSettings,
    updateSettings,
};
