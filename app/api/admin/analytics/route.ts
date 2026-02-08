import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

// Helper to get date range filter
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
    case "all":
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

    // Database-based metrics
    // Total Revenue = DELIVERED only (no shipping). Total Shipping = delivered count × 300 (like dashboard).
    // Completed Orders = DELIVERED count. Cancelled Orders = CANCELLED count. Cancelled Revenue = CANCELLED only.
    const [
      totalOrders,
      allOrdersRevenueAgg,
      deliveredAgg,
      cancelledAgg,
      totalUsers,
      repeatBuyers,
      topProducts,
      topProductsAllOrders,
      refundedOrders,
    ] = await Promise.all([
      // Total orders (all statuses)
      prisma.order.count({
        where: dateFilter ? { createdAt: dateFilter } : undefined,
      }),

      // Total order value (all orders, any status) – gross order value
      prisma.order.aggregate({
        where: dateFilter ? { createdAt: dateFilter } : undefined,
        _sum: { total: true },
      }),

      // Delivered: revenue sum + count (for Total Revenue, Total Shipping, Completed Orders)
      prisma.order.aggregate({
        where: {
          ...(dateFilter ? { createdAt: dateFilter } : {}),
          status: "DELIVERED",
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      // Cancelled: revenue sum + count (for Cancelled Order Revenue, Cancelled Orders)
      prisma.order.aggregate({
        where: {
          ...(dateFilter ? { createdAt: dateFilter } : {}),
          status: "CANCELLED",
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      // Total users
      prisma.user.count({
        where: dateFilter ? { createdAt: dateFilter } : undefined,
      }),

      // Repeat buyers (users with more than 1 order)
      prisma.user.count({
        where: {
          orders: {
            ...(dateFilter
              ? {
                  some: {
                    createdAt: dateFilter,
                  },
                }
              : {
                  some: {},
                }),
          },
        },
      }).then(async (count) => {
        // Filter to only users with > 1 order
        const usersWithMultipleOrders = await prisma.user.findMany({
          where: {
            orders: {
              ...(dateFilter
                ? {
                    some: {
                      createdAt: dateFilter,
                    },
                  }
                : {
                    some: {},
                  }),
            },
          },
          include: {
            orders: {
              where: dateFilter ? { createdAt: dateFilter } : undefined,
            },
          },
        });

        return usersWithMultipleOrders.filter((u) => u.orders.length > 1).length;
      }),

      // Top selling products (only from paid orders)
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
          status: "ACTIVE",
          order: {
            paymentStatus: "SUCCESS",
            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        _sum: {
          quantity: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: 10,
      }).then(async (items) => {
        // Get product details
        const productIds = items.map((item) => item.productId);
        const products = await prisma.product.findMany({
          where: {
            id: { in: productIds },
          },
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        });

        return items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return {
            productId: item.productId,
            productName: product?.name || "Unknown",
            productSlug: product?.slug,
            productImage: product?.images[0],
            totalQuantity: item._sum.quantity || 0,
            orderCount: item._count.id,
          };
        });
      }),

      // Top selling products (ALL orders, any status)
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: dateFilter ? { order: { createdAt: dateFilter } } : {},
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }).then(async (items) => {
        const productIds = items.map((item) => item.productId);
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        });
        return items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return {
            productId: item.productId,
            productName: product?.name || "Unknown",
            productSlug: product?.slug,
            productImage: product?.images[0],
            totalQuantity: item._sum.quantity || 0,
            orderCount: item._count.id,
          };
        });
      }),

      // Refunded/cancelled orders count
      prisma.order.count({
        where: {
          ...(dateFilter ? { createdAt: dateFilter } : {}),
          status: "CANCELLED",
        },
      }),
    ]);

    // Event-based metrics
    const [
      totalVisitors,
      addToCartEvents,
      checkoutStartedEvents,
      orderCompletedEvents,
    ] = await Promise.all([
      // Unique visitors (unique sessionIds)
      prisma.analyticsEvent.groupBy({
        by: ["sessionId"],
        where: {
          event: "PAGE_VIEW",
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }).then((result) => result.length),

      // Add to cart events
      prisma.analyticsEvent.count({
        where: {
          event: "ADD_TO_CART",
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),

      // Checkout started events
      prisma.analyticsEvent.count({
        where: {
          event: "CHECKOUT_STARTED",
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),

      // Order completed events
      prisma.analyticsEvent.count({
        where: {
          event: "ORDER_COMPLETED",
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),
    ]);

    // Calculate conversion rates
    const conversionRates = {
      visitToCart: totalVisitors > 0 ? (addToCartEvents / totalVisitors) * 100 : 0,
      cartToCheckout: addToCartEvents > 0 ? (checkoutStartedEvents / addToCartEvents) * 100 : 0,
      checkoutToOrder: checkoutStartedEvents > 0 ? (orderCompletedEvents / checkoutStartedEvents) * 100 : 0,
      visitToOrder: totalVisitors > 0 ? (orderCompletedEvents / totalVisitors) * 100 : 0,
    };

    // --- By source, new vs returning, by country, ad spend (may fail if schema not migrated) ---
    let bySource: Record<string, { visitors: number; addToCart: number; checkout: number; orders: number; revenue: number }> = {};
    let newVisitors = 0;
    let returningVisitors = 0;
    let byCountry: Record<string, { visitors: number; addToCart: number; checkout: number; orders: number; revenue: number }> = {};
    let spendBySource: Record<string, number> = {};
    let roasBySource: Record<string, number | null> = {};

    try {
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
              metadata: true,
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
              metadata: true,
            },
          });

      const sourceKey = (e: { utmSource: string | null }) => e.utmSource || "(direct)";
      for (const e of eventsInRange) {
        const key = sourceKey(e);
        if (!bySource[key]) bySource[key] = { visitors: 0, addToCart: 0, checkout: 0, orders: 0, revenue: 0 };
        if (e.event === "PAGE_VIEW") bySource[key].visitors += 1;
        if (e.event === "ADD_TO_CART") bySource[key].addToCart += 1;
        if (e.event === "CHECKOUT_STARTED") bySource[key].checkout += 1;
        if (e.event === "ORDER_COMPLETED") {
          bySource[key].orders += 1;
          const total = (e.metadata as { total?: number })?.total;
          if (typeof total === "number") bySource[key].revenue += total;
        }
      }
      const visitorsBySource: Record<string, Set<string>> = {};
      for (const e of eventsInRange) {
        if (e.event !== "PAGE_VIEW") continue;
        const key = sourceKey(e);
        if (!visitorsBySource[key]) visitorsBySource[key] = new Set();
        visitorsBySource[key].add(e.sessionId);
      }
      for (const key of Object.keys(bySource)) {
        bySource[key].visitors = visitorsBySource[key]?.size ?? 0;
      }

      const sessionIdsInRange = [...new Set(eventsInRange.map((e) => e.sessionId))];
      const firstTouchBySession: Record<string, Date> = {};
      if (sessionIdsInRange.length > 0) {
        const allForSessions = await prisma.analyticsEvent.findMany({
          where: { sessionId: { in: sessionIdsInRange } },
          select: { sessionId: true, createdAt: true },
        });
        for (const e of allForSessions) {
          const t = e.createdAt.getTime();
          if (!firstTouchBySession[e.sessionId] || firstTouchBySession[e.sessionId].getTime() > t) {
            firstTouchBySession[e.sessionId] = e.createdAt;
          }
        }
      }
      const startDate = dateFilter ? (dateFilter as { gte: Date }).gte : new Date(0);
      for (const sid of sessionIdsInRange) {
        const first = firstTouchBySession[sid];
        if (!first) continue;
        if (first.getTime() >= startDate.getTime()) newVisitors += 1;
        else returningVisitors += 1;
      }

      const countryKey = (e: { country: string | null }) => e.country || "Unknown";
      for (const e of eventsInRange) {
        const key = countryKey(e);
        if (!byCountry[key]) byCountry[key] = { visitors: 0, addToCart: 0, checkout: 0, orders: 0, revenue: 0 };
        if (e.event === "PAGE_VIEW") byCountry[key].visitors += 1;
        if (e.event === "ADD_TO_CART") byCountry[key].addToCart += 1;
        if (e.event === "CHECKOUT_STARTED") byCountry[key].checkout += 1;
        if (e.event === "ORDER_COMPLETED") {
          byCountry[key].orders += 1;
          const total = (e.metadata as { total?: number })?.total;
          if (typeof total === "number") byCountry[key].revenue += total;
        }
      }
      const visitorsByCountry: Record<string, Set<string>> = {};
      for (const e of eventsInRange) {
        if (e.event !== "PAGE_VIEW") continue;
        const key = countryKey(e);
        if (!visitorsByCountry[key]) visitorsByCountry[key] = new Set();
        visitorsByCountry[key].add(e.sessionId);
      }
      for (const key of Object.keys(byCountry)) {
        byCountry[key].visitors = visitorsByCountry[key]?.size ?? 0;
      }

      const spendStart = dateFilter ? (dateFilter as { gte: Date }).gte : new Date(0);
      const adSpendRows = await prisma.adSpend.findMany({
        where: { spendDate: { gte: spendStart } },
      });
      for (const row of adSpendRows) {
        const key = row.utmSource || "(direct)";
        spendBySource[key] = (spendBySource[key] || 0) + Number(row.amount);
      }
      for (const key of Object.keys(bySource)) {
        const rev = bySource[key].revenue || 0;
        const spend = spendBySource[key] || 0;
        roasBySource[key] = spend > 0 ? rev / spend : null;
      }
    } catch (extrasError) {
      console.error("Analytics extras (by source, country, ad spend):", extrasError);
      // Continue with empty bySource, byCountry, etc. so main metrics still return
    }

    const totalRevenueAllOrders = Number(allOrdersRevenueAgg._sum.total) || 0;
    const deliveredRevenue = Number(deliveredAgg._sum.total) || 0;
    const deliveredOrdersCount = deliveredAgg._count.id || 0;
    const totalShipping = deliveredOrdersCount * 300; // Same as dashboard: 300 per delivered order
    const cancelledOrderRevenue = Number(cancelledAgg._sum.total) || 0;
    const cancelledOrdersCount = cancelledAgg._count.id || 0;
    const revenueDifference = deliveredRevenue - cancelledOrderRevenue;

    return NextResponse.json({
      databaseMetrics: {
        totalOrders,
        totalRevenueAllOrders,                     // Sum of all order totals (any status)
        completedOrders: deliveredOrdersCount,    // Completed = DELIVERED only
        cancelledOrders: cancelledOrdersCount,    // Cancelled = status CANCELLED only
        refundedOrders,
        totalRevenue: deliveredRevenue,           // DELIVERED only, no shipping
        totalShipping,                            // deliveredOrdersCount × 300 (like dashboard)
        cancelledOrderRevenue,                    // status CANCELLED only
        revenueDifference,
        deliveredOrdersCount,
        cancelledOrdersCountByStatus: cancelledOrdersCount,
        totalUsers,
        repeatBuyers,
        topProducts,
        topProductsAllOrders,
      },
      eventMetrics: {
        totalVisitors,
        addToCartEvents,
        checkoutStartedEvents,
        orderCompletedEvents,
      },
      conversionRates,
      metricsBySource: bySource,
      newVsReturning: { newVisitors, returningVisitors },
      byCountry,
      spendBySource,
      roasBySource,
      range,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics", detail: message },
      { status: 500 }
    );
  }
}
