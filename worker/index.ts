/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  ADMIN_EMAILS?: string;
  UAT_EMAILS?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (!isDispatchAuthPath(url.pathname)) {
      const accessResponse = enforceUatAccess(request, env);
      if (accessResponse) return withSecurityHeaders(accessResponse);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const response = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return withSecurityHeaders(response);
    }

    return withSecurityHeaders(await handler.fetch(request, env, ctx));
  },
};

function withSecurityHeaders(response: Response): Response {
  const secured = new Response(response.body, response);
  secured.headers.set("content-security-policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://championsbattledata.com; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; manifest-src 'self'; upgrade-insecure-requests");
  secured.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  secured.headers.set("x-content-type-options", "nosniff");
  secured.headers.set("x-frame-options", "DENY");
  secured.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  secured.headers.set("cross-origin-opener-policy", "same-origin");
  secured.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()");
  return secured;
}

export default worker;

const AUTHENTICATED_EMAIL_HEADER = "oai-authenticated-user-email";
const DISPATCH_AUTH_PATHS = new Set([
  "/signin-with-chatgpt",
  "/signout-with-chatgpt",
  "/callback",
]);

function isDispatchAuthPath(pathname: string): boolean {
  return DISPATCH_AUTH_PATHS.has(pathname);
}

function enforceUatAccess(request: Request, env: Env): Response | null {
  const email = request.headers.get(AUTHENTICATED_EMAIL_HEADER)?.trim().toLowerCase();
  const allowed = new Set([
    ...parseEmailList(env.UAT_EMAILS),
    ...parseEmailList(env.ADMIN_EMAILS),
  ]);
  const wantsHtml = request.method === "GET" && (request.headers.get("accept") ?? "").includes("text/html");

  if (!email) {
    if (wantsHtml) {
      const url = new URL(request.url);
      const returnTo = `${url.pathname}${url.search}`;
      const location = `/signin-with-chatgpt?return_to=${encodeURIComponent(returnTo)}`;
      return new Response(null, { status: 302, headers: { location, "cache-control": "no-store" } });
    }
    return accessJson(401, "AUTH_REQUIRED", "Sign in with ChatGPT to access this UAT site.");
  }

  if (allowed.size === 0) {
    return accessJson(503, "ACCESS_NOT_CONFIGURED", "The UAT access list is not configured.");
  }

  if (!allowed.has(email)) {
    if (wantsHtml) return accessDeniedPage();
    return accessJson(403, "UAT_ACCESS_DENIED", "This ChatGPT account is not on the UAT access list.");
  }

  return null;
}

function parseEmailList(value: string | undefined): string[] {
  return (value ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

function accessJson(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function accessDeniedPage(): Response {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UAT access denied</title></head><body><main><h1>UAT access denied</h1><p>This ChatGPT account is not on the Champions Lab UAT access list.</p><p>此 ChatGPT 帳號不在 Champions Lab 的 UAT 測試名單中。</p><a href="/signout-with-chatgpt?return_to=%2F">Sign out / 登出</a></main></body></html>`, {
    status: 403,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
