import * as jose from "jose";

const getSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET or AUTH_SECRET is required");
  return new TextEncoder().encode(secret);
};

const ALG = "HS256";
const EXPIRY = "7d"; // token valid for 7 days

export interface MobileTokenPayload {
  sub: string; // userId
  role: string;
  iat?: number;
  exp?: number;
}

export async function signMobileToken(userId: string, role: string): Promise<string> {
  return new jose.SignJWT({ role })
    .setSubject(userId)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

export async function verifyMobileToken(token: string): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getSecret());
    const sub = payload.sub;
    const role = payload.role as string;
    if (!sub || !role) return null;
    return { sub, role, iat: payload.iat, exp: payload.exp };
  } catch {
    return null;
  }
}
