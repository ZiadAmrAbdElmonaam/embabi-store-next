import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";

// API route to track analytics events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, metadata, utm_source, utm_medium, utm_campaign } = body;

    if (!event) {
      return NextResponse.json({ error: "Event type is required" }, { status: 400 });
    }

    // Get session (may be null for anonymous users)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    // Get or create session ID from cookies
    const cookieStore = await cookies();
    let sessionId = cookieStore.get("sessionId")?.value || cookieStore.get("analytics_session_id")?.value;

    if (!sessionId) {
      // Generate a new session ID for anonymous users
      sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    // Geography from headers (Vercel: x-vercel-ip-country, x-vercel-ip-country-region; Cloudflare: cf-ipcountry)
    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      null;
    const region =
      request.headers.get("x-vercel-ip-country-region") ||
      request.headers.get("cf-region") ||
      null;

    // Create analytics event
    await prisma.analyticsEvent.create({
      data: {
        event: event as any,
        userId,
        sessionId,
        metadata: metadata || {},
        utmSource: utm_source || null,
        utmMedium: utm_medium || null,
        utmCampaign: utm_campaign || null,
        country: country || null,
        region: region || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking analytics event:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}
