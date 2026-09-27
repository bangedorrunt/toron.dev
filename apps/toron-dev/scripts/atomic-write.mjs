// Crash-safe writes for the generators.
//
// writeFileSync truncates before it writes, so a process killed between the two
// leaves a file that is shorter than it should be. For the projected guides that
// is caught downstream: the freshness gate hashes every guide against
// catalog/guides.lock.json, and a truncated file does not match, so the gate
// fails closed. That safety net is a consequence of the lock being written
// last, not a property of the write, and it does not cover the generated
// content/docs/tools/ tree at all. That directory is gitignored, so `git
// checkout` cannot bring it back.
//
// The fix is the ordinary one: write to a temporary name in the same
// directory, then rename over the target. rename(2) within a filesystem is
// atomic, so a reader sees either the old file or the new one and never a
// half-written one.
import { renameSync, rmSync, writeFileSync } from "node:fs";

/**
 * Write `data` to `path` so that `path` is never observed half-written.
 *
 * The temporary file must live in the target's own directory: rename is only
 * atomic within a filesystem, and a tmpdir on another mount would silently
 * degrade to copy-then-delete, which is the thing this is here to prevent.
 */
export function atomicWriteSync(path, data) {
  // The pid keeps two concurrent generators from colliding on one temp name.
  const tmp = `${path}.tmp-${process.pid}`;
  try {
    writeFileSync(tmp, data);
    renameSync(tmp, path);
  } catch (error) {
    // Leaving the temp behind would show up as a stray file in the content
    // tree and, for the tools directory, as a page Next tries to route.
    rmSync(tmp, { force: true });
    throw error;
  }
}

/**
 * Replace a whole directory with `build`, which receives the staging path and
 * populates it.
 *
 * A directory cannot be renamed onto a non-empty one, so the swap is
 * remove-then-rename. That is still one step rather than N, which is the
 * improvement: an interrupted run cannot leave a partially written tree, only
 * either the old tree, the new one, or nothing (regenerated on the next run).
 */
export function atomicReplaceDirSync(target, build) {
  const staging = `${target}.tmp-${process.pid}`;
  rmSync(staging, { recursive: true, force: true });
  try {
    build(staging);
    rmSync(target, { recursive: true, force: true });
    renameSync(staging, target);
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}
