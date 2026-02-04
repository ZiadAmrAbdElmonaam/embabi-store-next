import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { verifyMobileToken } from "@/lib/jwt";

/**
 * Check if the request is authorized as admin.
 * Allows either:
 * 1. NextAuth session with role ADMIN (web dashboard)
 * 2. Authorization: Bearer <JWT> with role ADMIN (mobile app login)
 * 3. Header X-Admin-API-Key matching ADMIN_MOBILE_API_KEY (optional, legacy)
 */
export async function isAdminRequest(request: Request): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === "ADMIN") return true;

  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = await verifyMobileToken(token);
    if (payload?.role === "ADMIN") return true;
  }

  const apiKey = request.headers.get("X-Admin-API-Key");
  const expectedKey = process.env.ADMIN_MOBILE_API_KEY;
  if (expectedKey && apiKey === expectedKey) return true;

  return false;
}
