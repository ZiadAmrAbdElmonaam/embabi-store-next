// Client-side analytics tracking utility

const UTM_STORAGE_KEY = "analytics_first_touch_utm";
const CLICK_IDS_STORAGE_KEY = "analytics_first_touch_click_ids";

export type EventType = 
  | "PAGE_VIEW"
  | "ADD_TO_CART"
  | "CHECKOUT_STARTED"
  | "ORDER_COMPLETED"
  | "ORDER_CANCELLED"
  | "REFUND_REQUESTED";

export interface UTMParams {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

interface TrackEventParams {
  event: EventType;
  metadata?: Record<string, any>;
  utm?: UTMParams;
}

// Get UTM params from current URL
function getUTMFromURL(): UTMParams | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source");
  const medium = params.get("utm_medium");
  const campaign = params.get("utm_campaign");
  if (!source && !medium && !campaign) return null;
  return {
    utm_source: source || null,
    utm_medium: medium || null,
    utm_campaign: campaign || null,
  };
}

// Get first-touch UTM from storage, or from URL if present, then store it
function getFirstTouchUTM(): UTMParams | null {
  if (typeof window === "undefined") return null;
  const fromUrl = getUTMFromURL();
  if (fromUrl && (fromUrl.utm_source || fromUrl.utm_medium || fromUrl.utm_campaign)) {
    try {
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
    } catch (_) {}
    return fromUrl;
  }
  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as UTMParams;
  } catch (_) {}
  return null;
}

// Get fbclid/gclid from URL and store on first touch
function getFirstTouchClickIds(): { fbclid?: string | null; gclid?: string | null } {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid");
  const gclid = params.get("gclid");
  if (fbclid || gclid) {
    try {
      localStorage.setItem(CLICK_IDS_STORAGE_KEY, JSON.stringify({ fbclid: fbclid || null, gclid: gclid || null }));
    } catch (_) {}
    return { fbclid: fbclid || null, gclid: gclid || null };
  }
  try {
    const stored = localStorage.getItem(CLICK_IDS_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as { fbclid?: string | null; gclid?: string | null };
  } catch (_) {}
  return {};
}

/** First-touch UTM + fbclid/gclid for order attribution. Call from checkout before submitting order. */
export function getAttributionForOrder(): {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
} {
  const utm = getFirstTouchUTM();
  const clickIds = getFirstTouchClickIds();
  return {
    utm_source: utm?.utm_source ?? null,
    utm_medium: utm?.utm_medium ?? null,
    utm_campaign: utm?.utm_campaign ?? null,
    fbclid: clickIds.fbclid ?? null,
    gclid: clickIds.gclid ?? null,
  };
}

// Get or create session ID
function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem("analytics_session_id");
  
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem("analytics_session_id", sessionId);
    
    // Also set cookie for server-side access
    document.cookie = `sessionId=${sessionId}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year
  }
  
  return sessionId;
}

// Track analytics event (sends first-touch UTM with every event)
export async function trackEvent({ event, metadata, utm }: TrackEventParams) {
  try {
    const sessionId = getSessionId();
    const utmToSend = utm ?? getFirstTouchUTM();
    
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event,
        metadata: metadata || {},
        utm_source: utmToSend?.utm_source ?? undefined,
        utm_medium: utmToSend?.utm_medium ?? undefined,
        utm_campaign: utmToSend?.utm_campaign ?? undefined,
      }),
    });
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    console.error("Failed to track event:", error);
  }
}

// Track page view
export function trackPageView(path?: string) {
  trackEvent({
    event: "PAGE_VIEW",
    metadata: {
      path: path || (typeof window !== "undefined" ? window.location.pathname : ""),
    },
  });
}

// Track add to cart
export function trackAddToCart(productId: string, productName?: string, quantity?: number) {
  trackEvent({
    event: "ADD_TO_CART",
    metadata: {
      productId,
      productName,
      quantity: quantity || 1,
    },
  });
}

// Track checkout started
export function trackCheckoutStarted() {
  trackEvent({
    event: "CHECKOUT_STARTED",
  });
}

// Track order completed
export function trackOrderCompleted(orderId: string, total?: number) {
  trackEvent({
    event: "ORDER_COMPLETED",
    metadata: {
      orderId,
      total,
    },
  });
}

// Track order cancelled
export function trackOrderCancelled(orderId: string) {
  trackEvent({
    event: "ORDER_CANCELLED",
    metadata: {
      orderId,
    },
  });
}

// Track refund requested
export function trackRefundRequested(orderId: string) {
  trackEvent({
    event: "REFUND_REQUESTED",
    metadata: {
      orderId,
    },
  });
}
