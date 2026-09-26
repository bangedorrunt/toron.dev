export const appName = "toron";
export const docsRoute = "/docs";
export const docsImageRoute = "/og/docs";
export const docsContentRoute = "/llms.mdx/docs";

// governed-by: ADR-0005 D1
// The one place an origin is written. It must name the host that actually
// serves this site. The brand and the repo are both "toron.dev" and the
// domain toron.dev belongs to an unrelated product, so a literal hostname
// typed into any other file is a defect the build now fails on.
export const siteUrl = "https://toronmail.vercel.app";

export function absoluteUrl(path = "/"): string {
  return new URL(path, siteUrl).toString();
}

// fill this with your actual GitHub info, for example:
export const gitConfig = {
  user: "bangedorrunt",
  repo: "toron.dev",
  branch: "main",
};
