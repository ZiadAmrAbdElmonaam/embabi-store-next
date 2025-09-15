import { NextRequest, NextResponse } from "next/server";
import { verifyPaymobHmac } from "@/lib/paymob";
import { prisma } from "@/lib/prisma";

// Ordered keys for processed webhook HMAC (per Paymob support HMAC Processed Callback)
// Applies to both Unified Intention (transaction) and Integration callbacks (obj)
const PROCESSED_ORDERED_KEYS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
];

export async function POST(req: NextRequest) {
  console.log("🔔 Paymob PROCESSED webhook called!");
  console.log("📅 Timestamp:", new Date().toISOString());
  try {
    const url = new URL(req.url);
    const hmacFromQuery = url.searchParams.get("hmac");
    const payload = await req.json();
    console.log("📦 Processed webhook payload:", JSON.stringify(payload, null, 2));

    // Support both formats:
    // - Unified Intention: { hmac, transaction, intention }
    // - Integration callback: query ?hmac=... and body { type: 'TRANSACTION', obj: {...} }
    const hmac = (payload as any)?.hmac || hmacFromQuery || "";
    const data = (payload as any)?.transaction || (payload as any)?.obj;
    const intention = (payload as any)?.intention;

    if (!hmac) {
      console.log("🔴 Missing HMAC");
      return NextResponse.json({ error: "Missing HMAC" }, { status: 400 });
    }

    if (!data) {
      console.log("🔴 Missing transaction/obj data");
      return NextResponse.json({ error: "Missing transaction data" }, { status: 400 });
    }

    // Use transaction data for HMAC validation
    console.log("🔍 HMAC validation debug:");
    console.log("🔍 Expected HMAC:", hmac);
    console.log("🔍 Ordered keys:", PROCESSED_ORDERED_KEYS);
    
    // Extract all fields from chosen data object to see what Paymob is actually using
    const { flatten } = await import("@/lib/paymob");
    const flat = flatten(data);
    console.log("🔍 All available fields in transaction:", Object.keys(flat).sort());
    console.log("🔍 Field values:", flat);
    
    // Re-enable HMAC validation with corrected field order
    const valid = verifyPaymobHmac(data, hmac, PROCESSED_ORDERED_KEYS);
    
    if (!valid) {
      console.error("Invalid Paymob HMAC for processed webhook");
      console.log("🔍 Transaction data for HMAC:", JSON.stringify(data, null, 2));
      
      // Let's try to debug the HMAC calculation
      const { flatten } = await import("@/lib/paymob");
      const flat = flatten(data);
      console.log("🔍 Flattened transaction:", flat);
      
      const concatenated = PROCESSED_ORDERED_KEYS
        .map((k) => {
          const value = flat[k];
          let result = "";
          if (value === undefined || value === null) {
            result = "";
          } else if (Array.isArray(value)) {
            result = JSON.stringify(value);
          } else {
            result = String(value);
          }
          console.log(`🔍 Field ${k}: ${value} -> "${result}"`);
          return result;
        })
        .join("");
      console.log("🔍 Concatenated string:", concatenated);
      console.log("🔍 Concatenated string length:", concatenated.length);
      
      return NextResponse.json({ error: "Invalid HMAC" }, { status: 400 });
    }

    const success = Boolean((data as any).success);
    const pending = Boolean((data as any).pending);
    const orderId = String((data as any)?.order?.id || "");
    const transactionId = (data as any)?.id ? String((data as any).id) : null;
    const merchantOrderId =
      intention?.special_reference ||
      (payload as any)?.payment_key_claims?.extra?.merchant_order_id ||
      (payload as any)?.obj?.order?.merchant_order_id ||
      "";

    const localOrderId = merchantOrderId || orderId;

    console.log(`🔍 Processing webhook: success=${success}, pending=${pending}, localOrderId=${localOrderId}`);

    if (localOrderId) {
      // Determine payment status and order status based on Paymob response
      let paymentStatus: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING';
      let orderStatus: 'PENDING' | 'PROCESSING' | 'CANCELLED' = 'PENDING';

      if (success && !pending) {
        // Payment successful
        paymentStatus = 'SUCCESS';
        orderStatus = 'PROCESSING'; // Ready for fulfillment
      } else if (!success && pending) {
        // Payment still pending
        paymentStatus = 'PENDING';
        orderStatus = 'PENDING'; // Wait for final result
      } else if (!success && !pending) {
        // Payment failed
        paymentStatus = 'FAILED';
        orderStatus = 'CANCELLED'; // Failed payment = cancelled order
      }

      console.log(`Updating order ${localOrderId}: paymentStatus=${paymentStatus}, orderStatus=${orderStatus}`);

      await prisma.order.update({
        where: { id: localOrderId },
        data: {
          paymentStatus: paymentStatus as any,
          status: orderStatus as any,
          trnxId: transactionId,
          statusHistory: {
            create: {
              status: orderStatus as any,
              comment: `Payment ${paymentStatus.toLowerCase()} - Updated by Paymob webhook`,
            },
          },
        },
      }).catch((e) => {
        console.error("Failed to update order from Paymob webhook", e);
      });
    } else {
      console.log("🔴 No local order ID found for webhook update");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Processed webhook error", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}



