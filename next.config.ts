import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    const imgSrc = ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://www.facebook.com", "https://www.google.com", "https://*.google.com", "https://*.googleapis.com"];
    const scriptSrc = ["'self'", "https://connect.facebook.net", "'unsafe-inline'"];
    const frameSrc = ["'self'", "https://accept.paymob.com", "https://accept.paymobsolutions.com", "https://www.google.com"];
    const connectSrc = ["'self'", "https://accept.paymobsolutions.com", "https://www.facebook.com"];
    const cspParts = [
      "default-src 'self'",
      `script-src ${scriptSrc.join(" ")}`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src ${imgSrc.join(" ")}`,
      `font-src 'self'`,
      `frame-src ${frameSrc.join(" ")}`,
      "frame-ancestors 'none'",
      `connect-src ${connectSrc.join(" ")}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];
    if (process.env.NODE_ENV === "production") {
      cspParts.push("upgrade-insecure-requests");
    }
    const csp = cspParts.join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
          { key: "Content-Security-Policy", value: csp },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
