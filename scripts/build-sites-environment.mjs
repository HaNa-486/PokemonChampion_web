import { spawnSync } from "node:child_process";

const environment = process.argv[2];
if (environment !== "dev" && environment !== "production") {
  throw new Error('Usage: node scripts/build-sites-environment.mjs <dev|production>');
}

const result = spawnSync("pnpm", ["run", "build"], {
  cwd: process.cwd(),
  env: { ...process.env, SITES_ENV: environment },
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
