import NextAuth from "next-auth";
import { authOptions } from "../auth-options";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

type NextAuthRouteContext = { params: Promise<{ nextauth?: string[] }> };

export async function GET(req: Request, context: NextAuthRouteContext) {
  return handler(req, context);
}

export async function POST(req: Request, context: NextAuthRouteContext) {
  const key = getRateLimitKey(req);
  const limit = checkRateLimit(key, "login");
  if (!limit.success) {
    return new Response(
      JSON.stringify({ error: "Too many login attempts. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
    );
  }
  return handler(req, context);
} 