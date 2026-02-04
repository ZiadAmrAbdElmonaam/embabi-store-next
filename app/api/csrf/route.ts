import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf";

export async function GET() {
  const token = generateCsrfToken();
  const res = NextResponse.json({ token });
  res.cookies.set("csrf_token", token, {
    httpOnly: false, // So client JS can read and send in X-CSRF-Token header
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h
  });
  return res;
}
