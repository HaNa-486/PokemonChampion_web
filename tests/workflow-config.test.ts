import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/sync-battle-data.yml", "utf8");

describe("battle-data synchronization workflow", () => {
  it("can update main and manage notification Issues", () => {
    expect(workflow).toContain("contents: write");
    expect(workflow).toContain("issues: write");
    expect(workflow).toContain("git push origin HEAD:main");
    expect(workflow).toContain('echo "sha=$(git rev-parse HEAD)" >> "$GITHUB_OUTPUT"');
  });

  it("only requests deployment after a changed snapshot passes validation", () => {
    expect(workflow).toContain("if: steps.changes.outputs.changed == 'true' && success()");
    expect(workflow).toContain("deployment-required");
    expect(workflow).toContain("listForRepo");
    expect(workflow).toContain("issue_number: existing.number");
  });

  it("deduplicates failures and resolves them after recovery", () => {
    expect(workflow).toContain("if: failure()");
    expect(workflow).toContain("sync-failed");
    expect(workflow).toContain("Resolve a previous sync failure notification");
    expect(workflow).toContain("state: 'closed'");
  });

  it("uses Node 24 based official actions", () => {
    expect(workflow).toContain("actions/checkout@v6");
    expect(workflow).toContain("actions/setup-node@v6");
    expect(workflow).toContain("actions/github-script@v9");
    expect(workflow).not.toContain("actions/checkout@v4");
    expect(workflow).not.toContain("actions/setup-node@v4");
  });
});
