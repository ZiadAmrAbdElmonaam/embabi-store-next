import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";

    const now = new Date();
    let startDate: Date;
    switch (range) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    const items = await prisma.adSpend.findMany({
      where: { spendDate: { gte: startDate } },
      orderBy: { spendDate: "desc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching ad spend:", error);
    return NextResponse.json({ error: "Failed to fetch ad spend" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { utm_source, utm_medium, utm_campaign, amount, spend_date } = body;

    if (!utm_source || amount == null) {
      return NextResponse.json(
        { error: "utm_source and amount are required" },
        { status: 400 }
      );
    }

    const spendDate = spend_date ? new Date(spend_date) : new Date();

    const item = await prisma.adSpend.create({
      data: {
        utmSource: String(utm_source),
        utmMedium: utm_medium ? String(utm_medium) : null,
        utmCampaign: utm_campaign ? String(utm_campaign) : null,
        amount: Number(amount),
        spendDate,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error creating ad spend:", error);
    return NextResponse.json({ error: "Failed to create ad spend" }, { status: 500 });
  }
}
