import { readFileSync } from "node:fs";

const environment = process.argv[2];
if (environment !== "dev" && environment !== "production") {
  throw new Error('Usage: node scripts/assert-sites-build.mjs <dev|production>');
}

const sourcePath = environment === "dev"
  ? ".openai/hosting.dev.json"
  : ".openai/hosting.json";
const expected = JSON.parse(readFileSync(sourcePath, "utf8"));
const built = JSON.parse(readFileSync("dist/.openai/hosting.json", "utf8"));

if (JSON.stringify(built) !== JSON.stringify(expected)) {
  throw new Error(`Built Sites manifest does not match ${sourcePath}.`);
}

if (environment === "dev") {
  const production = JSON.parse(readFileSync(".openai/hosting.json", "utf8"));
  if (built.project_id === production.project_id) {
    throw new Error("Dev artifact contains the production Sites project ID.");
  }
}

console.log(`Verified ${environment} Sites manifest in dist/.openai/hosting.json.`);
