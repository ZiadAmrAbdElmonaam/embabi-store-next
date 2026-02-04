/**
 * Client-side CSRF token for critical API calls (orders, payments, admin).
 * Call getCsrfToken() before POST/PUT/DELETE to our API when using cookie auth.
 */

let cachedToken: string | null = null;

export async function getCsrfToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  const res = await fetch("/api/csrf", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get CSRF token");
  const data = await res.json();
  cachedToken = data.token ?? null;
  if (!cachedToken) throw new Error("No CSRF token in response");
  return cachedToken;
}

export async function getCsrfHeaders(): Promise<Record<string, string>> {
  const token = await getCsrfToken();
  return { "X-CSRF-Token": token };
}
