import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function getDateFilter(range: string) {
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
      return undefined;
  }
  return { gte: startDate };
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";
    const dateFilter = getDateFilter(range);

    const eventsInRange = dateFilter
      ? await prisma.analyticsEvent.findMany({
          where: { createdAt: dateFilter },
          select: {
            event: true,
            sessionId: true,
            utmSource: true,
            utmMedium: true,
            utmCampaign: true,
            country: true,
            region: true,
            metadata: true,
            createdAt: true,
          },
        })
      : await prisma.analyticsEvent.findMany({
          select: {
            event: true,
            sessionId: true,
            utmSource: true,
            utmMedium: true,
            utmCampaign: true,
            country: true,
            region: true,
            metadata: true,
            createdAt: true,
          },
        });

    const sourceKey = (s: string | null) => s || "(direct)";
    const bySource: Record<
      string,
      { visitors: Set<string>; addToCart: number; checkout: number; orders: number; revenue: number }
    > = {};
    for (const e of eventsInRange) {
      const key = sourceKey(e.utmSource);
      if (!bySource[key]) bySource[key] = { visitors: new Set(), addToCart: 0, checkout: 0, orders: 0, revenue: 0 };
      if (e.event === "PAGE_VIEW") bySource[key].visitors.add(e.sessionId);
      if (e.event === "ADD_TO_CART") bySource[key].addToCart += 1;
      if (e.event === "CHECKOUT_STARTED") bySource[key].checkout += 1;
      if (e.event === "ORDER_COMPLETED") {
        bySource[key].orders += 1;
        const total = (e.metadata as { total?: number })?.total;
        if (typeof total === "number") bySource[key].revenue += total;
      }
    }

    const spendStart = dateFilter ? (dateFilter as { gte: Date }).gte : new Date(0);
    const adSpendRows = await prisma.adSpend.findMany({
      where: { spendDate: { gte: spendStart } },
    });
    const spendBySource: Record<string, number> = {};
    for (const row of adSpendRows) {
      const key = row.utmSource || "(direct)";
      spendBySource[key] = (spendBySource[key] || 0) + Number(row.amount);
    }

    const rows: string[][] = [
      ["Source", "Visitors", "Add to Cart", "Checkout", "Orders", "Revenue", "Ad Spend", "ROAS"],
    ];
    for (const [source, m] of Object.entries(bySource)) {
      const spend = spendBySource[source] || 0;
      const roas = spend > 0 ? (m.revenue / spend).toFixed(2) : "";
      rows.push([
        source,
        String(m.visitors.size),
        String(m.addToCart),
        String(m.checkout),
        String(m.orders),
        String(m.revenue),
        String(spend),
        roas,
      ]);
    }

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const filename = `analytics-export-${range}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
