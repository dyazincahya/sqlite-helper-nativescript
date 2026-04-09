import { isAndroid, isIOS } from "@nativescript/core";

/**
 * Generate a unique UUID v4
 * Optimized using Native APIs for best performance and uniqueness
 * @returns {string} uuid
 */
export function generateUUID() {
  try {
    if (isAndroid) {
      return java.util.UUID.randomUUID().toString();
    } else if (isIOS) {
      return NSUUID.UUID().UUIDString.toLowerCase();
    }
  } catch (e) {
    // Fallback if native API fails (rare)
  }

  // standard RFC4122 v4 UUID fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
