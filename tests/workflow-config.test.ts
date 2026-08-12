import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/sync-battle-data.yml", "utf8");
const pullRequestWorkflow = readFileSync(".github/workflows/pull-request-validation.yml", "utf8");

describe("battle-data synchronization workflow", () => {
  it("updates an automation branch and manages notification Issues", () => {
    expect(workflow).toContain("contents: write");
    expect(workflow).toContain("issues: write");
    expect(workflow).not.toContain("pull-requests: write");
    expect(workflow).not.toContain("git push origin HEAD:main");
    expect(workflow).toContain("automation/battle-data-sync");
    expect(workflow).toContain("compare/main...${process.env.SYNC_BRANCH}?expand=1");
    expect(workflow).toContain("create a pull request through Codex or GitHub");
    expect(workflow).toContain('echo "sha=$(git rev-parse HEAD)" >> "$GITHUB_OUTPUT"');
    expect(workflow).toContain("data/generated/item-sprites.json");
    expect(workflow).toContain("public/items");
    expect(workflow).toContain("Held-item sprites");
    expect(workflow).toContain("run: pnpm data:audit:live");
    expect(workflow.indexOf("run: pnpm data:audit:live")).toBeLessThan(workflow.indexOf("run: pnpm verify:dev"));
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

  it("publishes an explicit summary for changed, unchanged, and failed runs", () => {
    expect(workflow).toContain("Publish synchronization summary");
    expect(workflow).toContain("if: always()");
    expect(workflow).toContain("The upstream sources were checked and no data changes were found.");
    expect(workflow).toContain("the new catalogs or assets were not pushed to the automation branch");
    expect(workflow).toContain("DEPLOYMENT_NOTIFICATION_OUTCOME");
    expect(workflow).toContain("LIVE_AUDIT_OUTCOME");
    expect(workflow).toContain("Changes detected");
    expect(workflow).toContain("Production deployment");
    expect(workflow).not.toContain("github.rest.pulls.create");
  });
});

describe("pull-request validation workflow", () => {
  it("runs the complete deployment gate for pull requests targeting main", () => {
    expect(pullRequestWorkflow).toContain("pull_request:");
    expect(pullRequestWorkflow).toContain("- main");
    expect(pullRequestWorkflow).toContain("contents: read");
    expect(pullRequestWorkflow).toContain("persist-credentials: false");
    expect(pullRequestWorkflow).toContain("pnpm install --frozen-lockfile");
    expect(pullRequestWorkflow).toContain("pnpm verify:dev");
  });

  it("cancels superseded runs and uses current official actions", () => {
    expect(pullRequestWorkflow).toContain("cancel-in-progress: true");
    expect(pullRequestWorkflow).toContain("actions/checkout@v6");
    expect(pullRequestWorkflow).toContain("actions/setup-node@v6");
  });
});
