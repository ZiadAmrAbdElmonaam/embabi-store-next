import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { signMobileToken } from "@/lib/jwt";

export async function POST(request: Request) {
  // Log so Vercel shows this route is hit (Runtime Logs / Function Logs)
  console.log("[mobile-login] POST received");
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email before logging in" },
        { status: 403 }
      );
    }

    const isValid = await compare(String(password), user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access only" },
        { status: 403 }
      );
    }

    const token = await signMobileToken(user.id, user.role);
    return NextResponse.json({ token });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[mobile-login] error:", err.message, err.stack);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
