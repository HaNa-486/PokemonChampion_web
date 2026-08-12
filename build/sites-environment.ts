import { resolve } from "node:path";

export type SitesEnvironment = "production" | "dev";

export function sitesEnvironment(value = process.env.SITES_ENV): SitesEnvironment {
  if (value === undefined || value === "" || value === "production") return "production";
  if (value === "dev") return "dev";
  throw new Error(`Unsupported SITES_ENV: ${value}. Expected "production" or "dev".`);
}

export function sitesManifestPath(root: string, environment = sitesEnvironment()) {
  return resolve(
    root,
    ".openai",
    environment === "dev" ? "hosting.dev.json" : "hosting.json",
  );
}
