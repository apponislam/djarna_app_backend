/**
 * Normalizes a phone number to E.164 format.
 *
 * - If it starts with '+', it treats it as a full international number.
 * - If it starts with '01' (11 digits), it assumes Bangladesh and adds '+88'.
 * - If it starts with '8801' (13 digits), it adds the '+'.
 * - Otherwise, it cleans it up and ensures it starts with '+'.
 *
 * @param phone - The raw phone number string from input.
 * @returns Normalized phone number string in E.164 format.
 */
export const normalizePhoneNumber = (phone: string): string => {
    // 1. Remove all non-numeric characters except for the leading '+'
    let cleaned = phone.replace(/[^\d+]/g, "");

    // 2. Handle cases where '+' is already provided (International)
    if (cleaned.startsWith("+")) {
        return cleaned;
    }

    // 3. Handle local Bangladesh format (e.g. 017...)
    if (cleaned.startsWith("01") && cleaned.length === 11) {
        return "+88" + cleaned;
    }

    // 4. Handle Bangladesh format without '+' (e.g. 88017...)
    if (cleaned.startsWith("8801") && cleaned.length === 13) {
        return "+" + cleaned;
    }

    // 5. Fallback: If no '+' is present, we try to ensure it starts with '+'
    // but in a global app, you usually need a country selector to know for sure.
    if (cleaned.length > 0) {
        return "+" + cleaned;
    }

    return cleaned;
};
