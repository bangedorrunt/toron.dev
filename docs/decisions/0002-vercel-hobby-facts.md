// governed-by: ADR-0001, ADR-0002

# ADR-0002 Appendix — Vercel Hobby Tier Facts (research-verified 2026-08-14)

*Renumbered from toron repo `ADR-0016` appendix (moved 2026-08-14).*

Sources: vercel.com/pricing, /docs/limits, /docs/plans/hobby, /legal/terms,
/docs/limits/fair-use-guidelines, /docs/cron-jobs/usage-and-pricing,
/docs/analytics/limits-and-pricing, /docs/vercel-firewall/ddos-mitigation,
/docs/monorepos, /blog/new-pro-pricing-plan, /docs/open-source-program —
all retrieved 2026-08-14 via research crew (transcript: VercelPlatform2).

## Pricing model (post-2025 revamp)

- The 2025 credit revamp was **Pro-only**; Hobby unchanged. Hobby has **no
  credits and cannot purchase overage** — fixed allowances, and exceeding any
  of them **pauses deployments/site** (503 DEPLOYMENT_PAUSED), resuming after
  ~30 days or on plan change. Not billed.
- Pro (the upgrade path, D5): $20/user/mo + $20 flexible usage credit.

## Hobby allowances (the numbers that matter)

| Resource | Hobby allowance |
|---|---|
| Fast Data Transfer | 100 GB/mo (overflow = pause, not bill) |
| Builds | 45 min/build max; **1 concurrent build**; no monthly minute cap (fair use) |
| Deployments | 100/day |
| Serverless functions | 1M invocations/mo; 4 Active CPU-hrs/mo; 300s max duration |
| Edge | 1M requests/mo; Middleware ≤50ms avg CPU |
| ISR writes | 200,000/mo |
| Image Optimization | 5K transformations/mo; 300K cache reads; 100K writes |
| Edge (Global) Config | 100K reads/mo; **100 writes/mo** |
| Cron | 100 jobs/project; **min interval once/day** |
| Web Analytics | 50K events/mo; 1-month reporting window; no custom events |
| Custom domains | 50/project; auto HTTPS |
| Deploy Hooks | 5/project (enough for the D3 rebuild wiring) |
| Preview retention | 30 days (10 most recent production deployments exempt) |
| DDoS | Automatic L3/L4/L7 mitigation + Attack Mode on ALL plans incl. Hobby |
| WAF | 3 custom rules; 3 IP blocks |

## The non-commercial clause (T1 trigger basis)

- ToS: Hobby is "personal or non-commercial use"; Vercel may disable a Hobby
  deployment "with or without notice."
- Fair-use definition of commercial: financial gain for **anyone** involved in
  **any part of production** — including "a paid employee or consultant
  writing the code." Explicit markers: payments, ads, affiliate-primary
  content, paid hosting, **donation links**.
- **toron.dev on Hobby = gray-to-OK** while: no donations, no ads, no paid
  staff/consultants producing it. Enforcement is complaint/audit-driven;
  documented unpause-on-appeal exists.
- Compliant escape hatches when it stops being gray: **Vercel Open Source
  Program** (Pro sponsorship, quarterly applications) or Pro.

## Free-tier verdict for toron.dev

**Yes** for a static-heavy docs site at <10k pageviews/mo: ~1–5 GB FDT,
build-per-commit fits 100/day, cron needs nothing finer than daily, analytics
(50K events) covers 5× projected traffic. Binding constraints, in order of
real risk:

1. **Non-commercial clause** — keep the site donation-free/ad-free (T1).
2. **100 GB FDT pause-not-bill** — a viral spike pauses the whole site with
   no paid mitigation on Hobby (T2 watches >50% sustained).
3. **1 concurrent build + 100 deployments/day** — doc deploys serialize
   during multi-commit sessions; skipped (path-filtered) builds still burn
   the daily deployment count.
