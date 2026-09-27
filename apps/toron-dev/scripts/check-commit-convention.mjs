// The commit subject rule, executable.
//
// This repo has two conventions in its history and that is deliberate, not an
// oversight. Twenty-nine commits use a Conventional Commits subject and thirty-
// seven do not. The thirty-seven are the ones the beads ledger and the
// verification receipts bind by sha, so retro-fitting a prefix to them would
// mean reopening twelve closed beads and re-gating each one, which trades a
// fail-closed audit trail for a tidier `git log`. That trade was declined. What
// is enforced here is the forward direction: a new commit gets a checkable
// subject, so the mixed history stops growing.
//
// This is NOT wired into the freshness gate. A build does not get to fail
// because of what is already in the history, and the checker's own audit mode
// exists precisely so the legacy drift can be reported without failing.
//
// Run: node scripts/check-commit-convention.mjs                     # audit, never fails
//      node scripts/check-commit-convention.mjs --message-file PATH # gate a commit
//
// The enforcing mode takes the path to a commit message file, which is the
// git commit-msg hook contract: the hook is handed the path as its first
// argument. It is deliberately not a pre-commit check, because pre-commit runs
// before the message has been composed, so there would be nothing to read.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

// The vocabulary is the set this repo actually uses, not the full Conventional
// Commits list. A wider set is a set nobody has to think about, and a type that
// appears for the first time should be a decision rather than an accident.
const TYPES = [
  "feat", // a capability a reader or an agent can observe
  "fix", // a defect, in this repo or in a gate
  "docs", // prose, copy, ADRs, learnings
  "chore", // the ledger, receipts, reservations, tooling
  "refactor", // no behaviour change
  "test",
  "perf",
  "build", // the toolchain, the build command, deploy config
  "ci",
  "style",
];

// A subject is `type(scope): summary`, where scope is optional, and the summary
// may end with the bead ids the commit is attributed to. The bead suffix is
// load-bearing: the commit guard refuses a commit whose message omits a bead
// token that appears in its diff, so a shape that forbade the suffix would be
// describing a commit this repo cannot make.
const SUBJECT = new RegExp(
  `^(?:${TYPES.join("|")})(?:\\([a-z0-9][a-z0-9./-]*\\))?: .+` +
    `(?: \\([A-Za-z0-9][A-Za-z0-9._-]*(?:, [A-Za-z0-9][A-Za-z0-9._-]*)*\\))?$`,
);

const fail = (msg) => {
  console.error(`FAIL ${msg}`);
  process.exitCode = 1;
};
const ok = (msg) => console.log(`ok   ${msg}`);

// --------------------------------------------------------------- the self-test
// A gate with no failing case cannot tell fixed from broken. This one is
// asserted both ways before it is trusted with a real commit: it must reject a
// subject with no type, and it must accept the shapes this repo really writes.
const SELF_TEST = [
  ["fix: bound every subprocess wait", true],
  ["docs: clear the em dashes out of the hand-written site prose", true],
  ["chore: rebind torondev-56u to the reworded history (torondev-56u)", true],
  ["fix(build): render mermaid on Vercel (torondev-vercel-first-deploy-z68)", true],
  ["docs: record why (torondev-56u, bd-a8p)", true],
  ["feat(site): publish the guides", true],
  // No type at all. This is the shape the 37 legacy commits use, and it is the
  // one thing this check exists to stop.
  ["Reproject the guides now that the product repos capitalise their titles", false],
  ["Stop the count check flagging a guide (torondev-56u)", false],
  // A type nobody agreed to. A wider vocabulary is a decision, not a default.
  ["init: sites-monorepo scaffold", false],
  ["wip: something", false],
  // Typed but empty, and typed with an empty scope.
  ["fix:", false],
  ["fix(): nothing", false],
  // Trailing whitespace is a shape the guard would otherwise let through.
  ["fix: trailing space ", false],
];

for (const [subject, shouldPass] of SELF_TEST) {
  const passed = SUBJECT.test(subject.trimEnd()) && subject === subject.trimEnd();
  if (passed !== shouldPass) {
    console.error(
      `FAIL the commit check disagrees with its own contract on ${JSON.stringify(subject)}: ` +
        `expected ${shouldPass ? "accept" : "reject"}, got ${passed ? "accept" : "reject"}. `,
    );
    console.error("     refusing to trust this run.");
    process.exit(1);
  }
}
ok(`subject shape (self-test ok, ${SELF_TEST.length} cases)`);

// ------------------------------------------------------------------- the check
const flagIndex = process.argv.indexOf("--message-file");

if (flagIndex !== -1) {
  // Read the message the commit is about to carry, not the one it last carried.
  // The bead guard that refuses an unattributed commit fires at this same
  // moment, and a check that ran against the wrong message would wave through a
  // commit that should have been refused.
  const path = process.argv[flagIndex + 1];
  if (!path) {
    fail("--message-file needs the path to a commit message file.");
  } else {
    const subject = readFileSync(path, "utf8").split("\n")[0].trimEnd();
    if (!subject) {
      fail("the commit has no subject line.");
    } else if (!SUBJECT.test(subject)) {
      fail(`the commit subject is not in the agreed shape:\n     ${subject}\n`);
      console.error(
        `     expected \`type(scope): summary\`, type one of ${TYPES.join(", ")}, optionally\n` +
          `     followed by the bead ids in parentheses. For example:\n` +
          `       fix(gate): stop the freshness check reading a quoted figure as a claim (torondev-56u)`,
      );
    } else {
      ok(`commit subject: ${subject}`);
    }
  }
} else {
  // Audit mode. Report, do not fail: these commits are bound to closed beads
  // and receipts, and a build must not go red over history it cannot change.
  const r = spawnSync("git", ["log", "--format=%H%x1f%s"], {
    encoding: "utf8",
    timeout: 30_000,
  });
  if (r.status !== 0 || !r.stdout) {
    console.log("skip   not a git repository, so the commit subjects are unchecked.");
    process.exit(0);
  }
  const lines = r.stdout.trim().split("\n");
  const legacy = lines.filter((l) => !SUBJECT.test(l.split("\x1f")[1] ?? ""));
  const okCount = lines.length - legacy.length;
  console.log(
    `commit subjects: ${okCount} of ${lines.length} follow \`type(scope): summary\`. ` +
      `${legacy.length} predate the rule and are left alone on purpose: they are bound to ` +
      `closed beads and verification receipts by sha, and retro-fitting them would trade a ` +
      `fail-closed ledger for a tidier log. Enforced forward by \`--message-file\`.`,
  );
}
