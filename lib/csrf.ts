import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";
const TOKEN_BYTES = 32;
const SEP = ".";

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET or NEXTAUTH_SECRET required for CSRF");
  return secret;
}

function sign(value: string): string {
  const secret = getSecret();
  const sig = createHmac("sha256", secret).update(value).digest("base64url");
  return `${value}${SEP}${sig}`;
}

function verify(signed: string): boolean {
  const secret = getSecret();
  const i = signed.lastIndexOf(SEP);
  if (i <= 0) return false;
  const value = signed.slice(0, i);
  const sig = signed.slice(i + 1);
  const expected = createHmac("sha256", secret).update(value).digest("base64url");
  if (sig.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(sig, "base64url"), Buffer.from(expected, "base64url"));
  } catch {
    return false;
  }
}

/** Generate a new CSRF token (value only; caller sets cookie). */
export function generateCsrfToken(): string {
  const value = randomBytes(TOKEN_BYTES).toString("base64url");
  return sign(value);
}

/** Get token from request: header first, then cookie. */
export function getCsrfTokenFromRequest(request: Request): string | null {
  const header = request.headers.get(CSRF_HEADER);
  if (header) return header;
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`${CSRF_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Verify that the request has a valid CSRF token. */
export function verifyCsrfRequest(request: Request): boolean {
  const token = getCsrfTokenFromRequest(request);
  if (!token) return false;
  return verify(token);
}

/**
 * Skip CSRF when request is authenticated with Bearer (e.g. mobile app).
 * When using cookies (browser), require CSRF for critical mutations.
 */
export function shouldRequireCsrf(request: Request): boolean {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return false;
  return true;
}

/**
 * If CSRF is required for this request and token is missing/invalid, returns a 403 Response.
 * Otherwise returns null (caller should proceed).
 */
export function requireCsrfOrReject(request: Request): Response | null {
  if (!shouldRequireCsrf(request)) return null;
  if (!verifyCsrfRequest(request)) {
    return new Response(
      JSON.stringify({ error: "Invalid or missing CSRF token" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}

export { CSRF_COOKIE, CSRF_HEADER };
