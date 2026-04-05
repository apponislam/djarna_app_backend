/**
 * Normalizes a phone number to E.164 format.
 * Specifically handles Bangladesh numbers starting with '01' by prepending '+88'.
 *
 * @param phone - The raw phone number string from input.
 * @returns Normalized phone number string.
 */
export const normalizePhoneNumber = (phone: string): string => {
    // Remove all non-numeric characters except for the leading '+'
    let cleaned = phone.replace(/[^\d+]/g, "");

    // If it starts with '01' (Bangladesh local format), prepend '+88'
    if (cleaned.startsWith("01") && cleaned.length === 11) {
        cleaned = "+88" + cleaned;
    }

    // If it starts with '8801' but no '+', prepend '+'
    if (cleaned.startsWith("8801") && cleaned.length === 13) {
        cleaned = "+" + cleaned;
    }

    // Ensure it always starts with '+'
    if (!cleaned.startsWith("+") && cleaned.length > 0) {
        cleaned = "+" + cleaned;
    }

    return cleaned;
};
