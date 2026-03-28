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
 * Handles deep updates for nested objects to avoid overwriting.
 */
const updateSettings = async (payload: Partial<IPlatformSettings>) => {
    let settings = await SettingsModel.findOne();

    if (!settings) {
        settings = await SettingsModel.create(payload);
        return settings;
    }

    // Prepare deep update object using dot notation
    const updateData: any = {};

    // Payment settings
    if (payload.payment) {
        if (payload.payment.commissionRate !== undefined) {
            updateData["payment.commissionRate"] = payload.payment.commissionRate;
        }
        if (payload.payment.escrowDuration !== undefined) {
            updateData["payment.escrowDuration"] = payload.payment.escrowDuration;
        }
    }

    // Currency settings
    if (payload.currency) {
        if (payload.currency.primary) {
            updateData["currency.primary"] = payload.currency.primary;
        }
        if (payload.currency.supported) {
            updateData["currency.supported"] = payload.currency.supported;
        }
    }

    // Location settings
    const addToSetData: any = {};
    const pullData: any = {};

    if (payload.location) {
        const { countries, cities, removeCountries, removeCities } = payload.location as any;

        // Add unique items to the existing array
        if (countries && countries.length > 0) {
            addToSetData["location.countries"] = { $each: countries };
        }
        if (cities && cities.length > 0) {
            addToSetData["location.cities"] = { $each: cities };
        }

        // Remove specific items from the existing array
        if (removeCountries && removeCountries.length > 0) {
            pullData["location.countries"] = { $in: removeCountries };
        }
        if (removeCities && removeCities.length > 0) {
            pullData["location.cities"] = { $in: removeCities };
        }
    }

    // Notification settings
    if (payload.notifications) {
        if (payload.notifications.email !== undefined) {
            updateData["notifications.email"] = payload.notifications.email;
        }
        if (payload.notifications.push !== undefined) {
            updateData["notifications.push"] = payload.notifications.push;
        }
    }

    // Construct final update object
    const finalUpdate: any = {};
    if (Object.keys(updateData).length > 0) finalUpdate.$set = updateData;
    if (Object.keys(addToSetData).length > 0) finalUpdate.$addToSet = addToSetData;
    if (Object.keys(pullData).length > 0) finalUpdate.$pull = pullData;

    const result = await SettingsModel.findByIdAndUpdate(settings._id, finalUpdate, { new: true, runValidators: true });

    return result;
};

export const SettingsService = {
    getSettings,
    updateSettings,
};
