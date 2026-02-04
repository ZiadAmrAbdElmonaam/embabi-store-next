/**
 * Server-side logger. In production, avoid exposing internal details in API responses.
 * Log full details server-side only.
 */

type LogLevel = "error" | "warn" | "info" | "debug";

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = meta ? { message, ...meta } : { message };
  const out = JSON.stringify({ level, ...payload, timestamp: new Date().toISOString() });
  if (level === "error") {
    console.error(out);
  } else if (level === "warn") {
    console.warn(out);
  } else {
    console.log(out);
  }
}

export const logger = {
  error(message: string, error?: unknown) {
    const meta: Record<string, unknown> = {};
    if (error instanceof Error) {
      meta.err = error.message;
      if (process.env.NODE_ENV !== "production") {
        meta.stack = error.stack;
      }
    } else if (error != null) {
      meta.err = String(error);
    }
    log("error", message, Object.keys(meta).length ? meta : undefined);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    log("warn", message, meta);
  },
  info(message: string, meta?: Record<string, unknown>) {
    log("info", message, meta);
  },
  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      log("debug", message, meta);
    }
  },
};

/** Generic message for API error responses in production. */
export function publicErrorMessage(internalMessage: string): string {
  if (process.env.NODE_ENV === "production") {
    return "An error occurred. Please try again later.";
  }
  return internalMessage;
}
