import { NextRequest, NextResponse } from "next/server";
import { verifyPaymobHmac } from "@/lib/paymob";

// Ordered keys for redirect callback HMAC (per Paymob docs)
// Note: For Unified Intention redirect, the transaction order is sent as `order` (not `order.id`).
const REDIRECT_ORDERED_KEYS = [
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
  "order",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
];

export async function GET(req: NextRequest) {
  console.log("🔄 Paymob REDIRECT webhook called!");
  console.log("📅 Timestamp:", new Date().toISOString());
  try {
    const url = new URL(req.url);
    console.log("🌐 Redirect URL:", url.toString());
    console.log("🔍 Full URL search:", url.search);
    console.log("🔍 URL searchParams entries:", Array.from(url.searchParams.entries()));
    
    const params = Object.fromEntries(url.searchParams.entries());
    console.log("📦 Redirect webhook params:", JSON.stringify(params, null, 2));
    
    // Log all headers for debugging
    console.log("📋 Request headers:", Object.fromEntries(req.headers.entries()));
    
    const { hmac, ...rest } = params;
    // Derive the external origin correctly behind proxies/tunnels
    const xfProto = req.headers.get("x-forwarded-proto");
    const xfHost = req.headers.get("x-forwarded-host");
    const hostHeader = req.headers.get("host");
    let derivedOrigin = `${(xfProto || url.protocol.replace(":", ""))}://${(xfHost || hostHeader || url.host)}`;
    if (derivedOrigin.startsWith("httphttp")) {
      derivedOrigin = derivedOrigin.replace("httphttp", "http");
    }
    // If the derived origin ends up pointing to localhost while a public base is configured, prefer the public base
    const publicBase = process.env.NEXT_PUBLIC_APP_URL;
    const origin = (publicBase && /localhost/.test(derivedOrigin)) ? publicBase : derivedOrigin;
    console.log("🔁 Resolved redirect origin:", origin);

    if (!hmac) {
      console.log("🔴 Missing HMAC - likely a failed payment redirect");
      
      // Check if we have any order-related parameters even without HMAC
      const orderId = params.merchant_order_id || params["merchant_order_id"] || params["order.merchant_order_id"] || params.order_id;
      
      if (orderId) {
        console.log("🔍 Found order ID in failed payment:", orderId);
        return NextResponse.redirect(`${origin}/orders/${orderId}?payment=failed`);
      }
      
      // If no order ID found, redirect to generic failed page
      console.log("🔍 No order ID found in failed payment redirect");
      return NextResponse.redirect(`${origin}/payment/result?status=failed`);
    }

    const valid = verifyPaymobHmac(rest, hmac, REDIRECT_ORDERED_KEYS);
    if (!valid) {
      console.log("🔴 Invalid HMAC");
      return NextResponse.redirect(`${origin}/payment/result?status=failed`);
    }

    const status = rest.success === "true" && rest.pending !== "true" ? "success" : rest.pending === "true" ? "pending" : "failed";
    const merchantOrderId = rest.merchant_order_id || rest["merchant_order_id"] || rest["order.merchant_order_id"] || "";
    
    // Redirect failed payments to order page with payment=failed flag
    if (status === "failed" && merchantOrderId) {
      console.log("🔴 Redirecting failed payment to order page:");
      return NextResponse.redirect(`${origin}/orders/${merchantOrderId}?payment=failed`);
    }
    
    // Redirect successful payments to order page
    if (status === "success" && merchantOrderId) {
      console.log("🔴 Redirecting to order:");
      return NextResponse.redirect(`${origin}/orders/${merchantOrderId}`);
    }
    
    // Redirect pending payments to payment result page
    return NextResponse.redirect(`${origin}/payment/result?status=${status}`);
  } catch (error) {
    try {
      const url = new URL(req.url);
      const origin = `${url.protocol}//${url.host}`;
      return NextResponse.redirect(`${origin}/payment/result?status=failed`);
    } catch {
      return NextResponse.json({ ok: false }, { status: 302, headers: { Location: "/payment/result?status=failed" } });
    }
  }
}



