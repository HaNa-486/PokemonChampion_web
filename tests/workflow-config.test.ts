import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/sync-battle-data.yml", "utf8");
const pullRequestWorkflow = readFileSync(".github/workflows/pull-request-validation.yml", "utf8");

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

  it("publishes an explicit summary for changed, unchanged, and failed runs", () => {
    expect(workflow).toContain("Publish synchronization summary");
    expect(workflow).toContain("if: always()");
    expect(workflow).toContain("The upstream sources were checked and no data changes were found.");
    expect(workflow).toContain("the new snapshot was not pushed to `main`");
    expect(workflow).toContain("DEPLOYMENT_NOTIFICATION_OUTCOME");
    expect(workflow).toContain("Changes detected");
    expect(workflow).toContain("Production deployment");
  });
});

describe("pull-request validation workflow", () => {
  it("runs the complete deployment gate for pull requests targeting main", () => {
    expect(pullRequestWorkflow).toContain("pull_request:");
    expect(pullRequestWorkflow).toContain("- main");
    expect(pullRequestWorkflow).toContain("contents: read");
    expect(pullRequestWorkflow).toContain("persist-credentials: false");
    expect(pullRequestWorkflow).toContain("pnpm install --frozen-lockfile");
    expect(pullRequestWorkflow).toContain("pnpm verify:deploy");
  });

  it("cancels superseded runs and uses current official actions", () => {
    expect(pullRequestWorkflow).toContain("cancel-in-progress: true");
    expect(pullRequestWorkflow).toContain("actions/checkout@v6");
    expect(pullRequestWorkflow).toContain("actions/setup-node@v6");
  });
});
