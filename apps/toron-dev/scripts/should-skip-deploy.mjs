/*
 * governed-by: ADR-0008 (the bun/oxlint/oxfmt toolchain, which is where the
 * Vercel build command and this gate live)
 *
 * The Ignored Build Step, as a script instead of a one-liner.
 *
 * The previous version was `git diff --quiet HEAD^ HEAD -- <paths>`, which
 * compares the last commit against its parent. A push of five commits where
 * the fifth is bookkeeping therefore reports no change, Vercel skips the build,
 * and the four commits that did change the site ship nothing. That is silent:
 * the push succeeds, the deployment is reported as cancelled rather than
 * failed, and the live site keeps serving the previous build.
 *
 * The fix is to diff the range that was actually pushed, which Vercel exposes as
 * VERCEL_GIT_PREVIOUS_SHA. Three details make this safe rather than clever:
 *
 * 1. The range is previous..HEAD, not previous..previous. Every commit in the
 *    push is in range, so a build-affecting commit followed by a bookkeeping
 *    commit still builds.
 * 2. An absent or empty VERCEL_GIT_PREVIOUS_SHA means the range is unknown, and
 *    an unknown range must build. Exit 1 (build) is the fail-open direction
 *    here, because a wasted build is cheap and a silently skipped deploy is not.
 * 3. A missing HEAD (a shallow or detached checkout with no such ref) also
 *    builds, for the same reason.
 *
 * Exit 0 skips the build, non-zero builds. That is the polarity Vercel expects.
 */

import { spawnSync } from "node:child_process";

const PATHS = ["apps", "packages", "catalog", "bun.lock", "vercel.json", "package.json"];

const previous = process.env.VERCEL_GIT_PREVIOUS_SHA?.trim();

if (!previous) {
  console.warn(
    "skip: VERCEL_GIT_PREVIOUS_SHA is not set, so the pushed range is unknown. Building, because a wasted build is cheaper than a deploy that silently does not happen.",
  );
  process.exit(1);
}

// git resolves a pathspec against the working directory, not the repository
// root, so a caller running from apps/toron-dev would ask for
// "apps/toron-dev/apps" and match nothing. Every such range then looks clean
// and the build is skipped, which is the exact failure this script exists to
// remove. The first version of this script omitted the chdir and skipped a
// range that did contain a change under apps/. The root is resolved here rather
// than assumed of the caller.
const root = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" });
if (root.status !== 0 || !root.stdout.trim()) {
  console.warn("skip: not inside a git repository, so the pushed range is unknown. Building.");
  process.exit(1);
}
const top = root.stdout.trim();

const diff = spawnSync("git", ["diff", "--quiet", `${previous}..HEAD`, "--", ...PATHS], {
  cwd: top,
  stdio: "inherit",
});

if (diff.error) {
  console.warn(`skip: git diff failed (${diff.error.message}). Building.`);
  process.exit(1);
}

// git diff exits 0 for "no differences" and 1 for "differences", so the codes
// have to be mapped rather than passed through: an unexpected code means we do
// not know whether anything changed, which is the build case.
if (diff.status === 0) {
  console.log(`skip: nothing under ${PATHS.join(", ")} changed in ${previous.slice(0, 12)}..HEAD.`);
  process.exit(0);
}

if (diff.status === 1) {
  console.log(`build: ${PATHS.join(", ")} changed in ${previous.slice(0, 12)}..HEAD.`);
  process.exit(1);
}

console.warn(`skip: git diff exited ${diff.status}, which is neither clean nor dirty. Building.`);
process.exit(1);
