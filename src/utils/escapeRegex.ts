/**
 * Escapes special regex characters in a string to make it safe to use in a regular expression query.
 */
export const escapeRegex = (value: string): string => {
    return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
