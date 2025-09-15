import { NextRequest, NextResponse } from "next/server";
import { buildHeaders, toCents, PAYMOB_BASE, PAYMOB_PUBLIC_KEY } from "@/lib/paymob";

type CreateIntentionBody = {
  orderId: string;
  amount: number;
  currency: string; // e.g. "EGP"
  billingData: { name: string; email: string; phone: string };
  payment_methods: string[]; // e.g. ["card"] or ["wallet"]
};

export async function POST(req: NextRequest) {
  console.log("🚀 Paymob intentions route called");
  try {
    const {
      orderId,
      amount,
      currency,
      billingData,
      payment_methods,
    } = (await req.json()) as CreateIntentionBody;
    
    console.log("📦 Received data:", { orderId, amount, currency, payment_methods });

   

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.warn("NEXT_PUBLIC_APP_URL not set, defaulting to http://localhost:3000");
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    // Debug environment variables
    console.log("Environment check:", {
      PAYMOB_SECRET_KEY: process.env.PAYMOB_SECRET_KEY ? "✓ Set" : "✗ Missing",
      PAYMOB_PUBLIC_KEY: process.env.PAYMOB_PUBLIC_KEY ? "✓ Set" : "✗ Missing",
      PAYMOB_API_KEY: process.env.PAYMOB_API_KEY ? "✓ Set" : "✗ Missing",
      PAYMOB_INTEGRATION_ID: process.env.PAYMOB_INTEGRATION_ID || "✗ Missing",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "✗ Missing"
    });
    console.log("🔑 PAYMOB_SECRET_KEY", process.env.PAYMOB_SECRET_KEY?.slice(0,10) + "...");

    // Per Paymob Unified Intention API
    const url = `${PAYMOB_BASE}/v1/intention/`;

    // Map data according to Paymob v1 intention API format
    const payload: Record<string, any> = {
      amount: toCents(amount),
      currency,
      // Use integration ID from environment
      payment_methods: [parseInt(process.env.PAYMOB_INTEGRATION_ID || '0')],
      items: [
        {
          name: "Order Items",
          amount: toCents(amount),
          description: `Order ${orderId}`,
          quantity: 1
        }
      ],
      billing_data: {
        first_name: billingData.name.split(' ')[0] || billingData.name,
        last_name: billingData.name.split(' ').slice(1).join(' ') || "User",
        email: billingData.email,
        phone_number: billingData.phone,
        country: "Egypt",
        apartment: "N/A",
        street: "N/A", 
        building: "N/A",
        city: "N/A",
        floor: "N/A",
        state: "N/A"
      },
      special_reference: orderId,
      // 5 minutes window
      expiration: 300,
      // Disable in-page retries; redirect immediately on first success/failure
      single_payment_attempt: true,
      notification_url: `${baseUrl}/api/paymob/webhooks/processed`,
      redirection_url: `${baseUrl}/api/paymob/webhooks/redirect`,
    };

    console.log("🔗 Sending to Paymob - redirection_url:", `${baseUrl}/api/paymob/webhooks/redirect`);
    console.log("🔗 Sending to Paymob - notification_url:", `${baseUrl}/api/paymob/webhooks/processed`);
    console.log("📤 Paymob payload:", JSON.stringify(payload, null, 2));

    const res = await fetch(url, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const status = res.status;
      console.error("Paymob intention error", { 
        status, 
        data, 
        url,
        headers: buildHeaders(),
        payload 
      });
      if (status === 400) {
        return NextResponse.json(
          { error: "Invalid request, please check your data." },
          { status }
        );
      }
      if (status === 401) {
        return NextResponse.json(
          { error: "Authorization error, please try again." },
          { status }
        );
      }
      return NextResponse.json(
        { error: "Payment service unavailable, try again later." },
        { status: 500 }
      );
    }

    // Unified Intention behavior:
    // - Cards (e.g., MIGS) typically return client_secret to be used with an iframe URL you construct
    // - Some methods may return a hosted payment_link/payment_url
    const paymentUrl = data?.payment_link || data?.payment_url || data?.redirect_url || null;
    const clientSecret: string | null = data?.client_secret || null;
    const iframeUrl =
      data?.iframe_url ||
      (process.env.PAYMOB_IFRAME_ID && clientSecret
        ? `${PAYMOB_BASE}/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?client_secret=${encodeURIComponent(
            clientSecret
          )}`
        : null);

    // If neither a redirectable URL nor client_secret is present, surface a clear error
    if (!paymentUrl && !clientSecret) {
      return NextResponse.json(
        { error: "Payment initiation did not return a redirect URL or client_secret." },
        { status: 502 }
      );
    }

    const unifiedCheckoutUrl = clientSecret && PAYMOB_PUBLIC_KEY
      ? `https://accept.paymob.com/unifiedcheckout/?publicKey=${encodeURIComponent(PAYMOB_PUBLIC_KEY)}&clientSecret=${encodeURIComponent(clientSecret)}`
      : null;

    return NextResponse.json({
      payment_url: paymentUrl || iframeUrl,
      iframe_url: iframeUrl,
      client_secret: clientSecret,
      unified_checkout_url: unifiedCheckoutUrl,
      order_id: data?.order_id || data?.id || orderId,
      status: "pending",
      raw: data,
    });
  } catch (error) {
    console.error("❌ /api/paymob/intentions error:", error);
    console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: "Payment service unavailable, try again later." },
      { status: 500 }
    );
  }
}



