import crypto from "crypto";

export function buildHeaders() {
  if (!process.env.PAYMOB_SECRET_KEY) {
    throw new Error("PAYMOB_SECRET_KEY is not set");
  }
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}`,
  } as const;
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

// Flattens nested objects using dot notation to match Paymob HMAC field addressing
export function flatten(obj: any, prefix = ""): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj || {})) {
    const value = (obj as any)[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flatten(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

export function verifyPaymobHmac(
  payload: Record<string, any>,
  expected: string,
  orderedKeys: string[]
): boolean {
  const flat = flatten(payload);
  const concatenated = orderedKeys
    .map((k) => {
      const value = flat[k];
      if (value === undefined || value === null) {
        return "";
      }
      if (Array.isArray(value)) {
        return JSON.stringify(value);
      }
      return String(value);
    })
    .join("");
  const secret = process.env.PAYMOB_HMAC_SECRET || "";
  const computed = crypto
    .createHmac("sha512", secret)
    .update(concatenated)
    .digest("hex");
  return computed === expected;
}

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export const PAYMOB_BASE = "https://accept.paymobsolutions.com";

// Helpful accessors for clarity across the codebase
export const PAYMOB_PUBLIC_KEY = process.env.PAYMOB_PUBLIC_KEY || "";
export const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY || "";



