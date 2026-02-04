/**
 * Enforce maximum request body size to reduce DoS risk.
 * Use with request.json() or request.text() - clone and read with limit.
 */

const DEFAULT_MAX_JSON_BYTES = 512 * 1024; // 512KB for JSON APIs

/**
 * Read request body as text up to maxBytes. Throws if exceeded.
 * Use before request.json() when you need to enforce size.
 */
export async function readBodyWithLimit(
  request: Request,
  maxBytes: number = DEFAULT_MAX_JSON_BYTES
): Promise<string> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const len = parseInt(contentLength, 10);
    if (!Number.isNaN(len) && len > maxBytes) {
      throw new Error(`Request body too large. Maximum size is ${maxBytes / 1024}KB.`);
    }
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) {
    throw new Error(`Request body too large. Maximum size is ${maxBytes / 1024}KB.`);
  }
  return text;
}

/**
 * Parse JSON from request with size limit. Returns parsed object.
 * Use instead of request.json() for protected routes.
 */
export async function readJsonWithLimit<T = unknown>(
  request: Request,
  maxBytes: number = DEFAULT_MAX_JSON_BYTES
): Promise<T> {
  const text = await readBodyWithLimit(request, maxBytes);
  return JSON.parse(text) as T;
}

export { DEFAULT_MAX_JSON_BYTES };
