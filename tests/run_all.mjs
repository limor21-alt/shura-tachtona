// Runs every test suite. Exits non-zero on first failure.
import { spawnSync } from "node:child_process";

const SUITES = [
  "tests/classify_smoke.mjs",
  "tests/gate_smoke.mjs",
  "tests/pipeline_smoke.mjs",
  "tests/acceptance.mjs",
  "tests/playbooks_smoke.mjs",
  "tests/pipeline_playbook_smoke.mjs",
  "tests/copy_writer_playbook_smoke.mjs",
  "tests/recurring_rules_smoke.mjs"
];

let totalPass = 0, totalFail = 0;

for (const suite of SUITES) {
  console.log(`\n${"━".repeat(60)}\n▶ ${suite}\n${"━".repeat(60)}`);
  const res = spawnSync("node", ["--experimental-strip-types", suite], {
    stdio: "inherit",
    env: process.env
  });
  if (res.status !== 0) {
    console.error(`\n✗ ${suite} failed (exit ${res.status})`);
    process.exit(res.status || 1);
  }
}

console.log("\n✓ all suites passed");
