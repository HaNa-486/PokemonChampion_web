declare interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

declare interface D1Database {
  prepare(query: string): unknown;
}

declare module "cloudflare:workers" {
  export const env: { DB?: D1Database; ADMIN_EMAILS?: string };
}
