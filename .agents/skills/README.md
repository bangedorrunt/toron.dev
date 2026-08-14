# Dogfooded agent skills

Installed 2026-08-14 via `npx skills add` (upstream installs — do NOT edit
contents; reinstall to update). Crews MUST read the matching skill before the
matching work (see root `AGENTS.md` skills contract).

| Skill | Source | Use for |
|---|---|---|
| `next-best-practices` | vercel-labs/openreview | File conventions, RSC boundaries, data patterns, async APIs, metadata; Next 16 `middleware`→`proxy` rename |
| `vercel-react-best-practices` | vercel-labs/agent-skills | 70 perf rules: waterfalls, bundle, re-render, memoization |
| `ui-ux-pro-max` ⚠ | nextlevelbuilder/ui-ux-pro-max-skill | Design database: styles, palettes, font pairings, UX guidelines. **⚠ skills.sh Gen Agent Trust Hub audit = FAIL (Socket + Snyk pass).** Use as reference for rules/palettes; do not run its scripts blind — review before executing anything from it |
| `next-cache-components-adoption` | vercel-labs/next.js | Next 16 cacheComponents adoption |
| `next-cache-components-optimizer` | vercel-labs/next.js | cacheComponents optimization passes |
| `next-dev-loop` | vercel-labs/next.js | Dev-loop discipline (build/test/lint) |
| `next-partial-prefetching-adoption` | vercel-labs/next.js | Partial prefetching |

## Deliberately NOT installed

- **vercel-labs/vercel-kb-skills** (captain-linked): all 4 skills are
  Webflow/Tanstack migration guides (`nextjs-webflow-to-vercel`,
  `astro-webflow-to-vercel`, `tanstack-start-{cloudflare,netlify}-to-vercel`)
  — inapplicable to a greenfield site. To add anyway:
  `npx skills add vercel-labs/vercel-kb-skills`
- Useful candidates for later: `deploy-to-vercel`, `web-design-guidelines`,
  `vercel-composition-patterns` (all vercel-labs/agent-skills).
