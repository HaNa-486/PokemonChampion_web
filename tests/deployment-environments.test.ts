import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isDevHostname } from "../components/DevEnvironmentBanner";
import { sitesEnvironment, sitesManifestPath } from "../build/sites-environment";

type HostingManifest = {
  project_id: string;
  d1: string | null;
  r2: string | null;
};

const production = JSON.parse(
  readFileSync(".openai/hosting.json", "utf8"),
) as HostingManifest;
const dev = JSON.parse(
  readFileSync(".openai/hosting.dev.json", "utf8"),
) as HostingManifest;
const contributorRules = readFileSync("AGENTS.md", "utf8");
const environmentBadge = readFileSync("components/DevEnvironmentBanner.tsx", "utf8");
const globalStyles = readFileSync("app/globals.css", "utf8");

describe("deployment environment boundaries", () => {
  it("uses distinct Sites projects with the same logical bindings", () => {
    expect(production.project_id).toBeTruthy();
    expect(dev.project_id).toBeTruthy();
    expect(dev.project_id).not.toBe(production.project_id);
    expect(dev.d1).toBe(production.d1);
    expect(dev.r2).toBe(production.r2);
  });

  it("requires Dev UAT before merge and separate production approval", () => {
    expect(contributorRules).toContain("Do not merge while UAT is pending");
    expect(contributorRules).toContain("requires the product owner's explicit approval");
    expect(contributorRules).toContain("Never use the production Sites project to preview");
  });

  it("shows the warning only on the Dev hostname", () => {
    expect(isDevHostname("champions-lab-dev.eddy8613.chatgpt.site")).toBe(true);
    expect(isDevHostname("champions-lab.eddy8613.chatgpt.site")).toBe(false);
    expect(environmentBadge).toContain('document.querySelector(".brand")');
    expect(environmentBadge).toContain("document.body");
    expect(environmentBadge).toContain("const pathname = usePathname()");
    expect(environmentBadge).toContain("useEffect(() =>");
    expect(environmentBadge).toContain("window.requestAnimationFrame");
    expect(environmentBadge).toContain("DEV / UAT");
    expect(environmentBadge).not.toContain("NOT PRODUCTION");
    expect(globalStyles).not.toContain(".dev-environment-badge { position: fixed");
    expect(globalStyles).toContain(".brand > span:nth-child(2) { display: none; }");
    expect(globalStyles).toContain(".dev-environment-fallback { position: fixed");
    expect(globalStyles).toContain("@media (max-width: 1100px)");
    expect(globalStyles).toContain(".topbar nav { order: 3; width: 100%; height: 42px; }");
  });

  it("selects environment manifests explicitly and rejects unknown values", () => {
    expect(sitesManifestPath(process.cwd(), "dev")).toMatch(/hosting\.dev\.json$/);
    expect(sitesManifestPath(process.cwd(), "production")).toMatch(/hosting\.json$/);
    expect(() => sitesEnvironment("preview")).toThrow(/Unsupported SITES_ENV/);
  });
});
