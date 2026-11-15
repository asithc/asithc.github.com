# Résumé traffic controls: prepared, not deployed

The site remains a GitHub Pages static site. No Cloudflare account, DNS, WAF rule or Worker has been changed. Do not describe these controls as active until deployed and tested.

## Domain prerequisites

Confirm asith.cc is on the intended Cloudflare account and its web DNS records are proxied. Preserve GitHub Pages custom-domain verification and use Full (strict) TLS with a valid origin certificate. Do not change mail or unrelated records.

## Concrete rules to configure

1. Security rules → Rate limiting rule. Match `http.request.uri.path eq "/files/Resume-Asith-Wijenayake-Lead-Product-Designer-International-12-Nov-2026.pdf"`. Count by IP; start at 10 requests per 10 seconds, Block for 10 seconds where available. Review security events and adjust for shared networks. Available periods/actions depend on the plan. PDF.js fetches one complete file per session; zoom and page changes do not fetch it again.
2. For that same PDF path, block known training-crawler user agents (GPTBot, ClaudeBot, CCBot, Bytespider, Google-Extended, Amazonbot, meta-externalagent). User agents are spoofable; this is a supplementary filter.
3. If entitled to Bot Management or static resource protection, protect PDF requests using bot signals. Do not apply an interactive challenge blindly to PDF fetches: a challenge HTML response breaks the in-app renderer. For a challenge-backed flow, first implement a Turnstile-verified session and a private résumé endpoint.
4. Deploy the included headers Worker with `npx wrangler deploy --config cloudflare/wrangler.jsonc` from the repo root after account review. It scopes noindex/no-store headers to PDFs and preserves content/status, including HTTP errors. Check edge analytics, error rate and normal viewer traffic after activation.

## Important limits and stronger protection

A Worker over the current URL cannot stop direct GitHub Pages/raw GitHub access to the same public PDF. Existing copies and Git history remain public. robots.txt is advisory. Public browser HTML/CSS/JS must be delivered to the visitor and cannot be made copy-proof.

For meaningful résumé access control: move the PDF to a private Cloudflare R2 bucket; remove the public asset from the current published tree; render through a Worker endpoint that validates a server-verified Turnstile token/session; apply edge rate limiting, no-store and noindex; update the shared viewer's single source URL. Disable public R2 access. Check direct GitHub/raw and old URL responses. This requires Cloudflare account access and does not erase previously public Git history or downloaded copies. Keep credentials in Cloudflare secrets, never in this repo.

Search and answer engines should retain access to public HTML, canonical metadata and llms summaries. Block training crawlers and résumé harvesting separately so discovery still works.

References:
- https://developers.cloudflare.com/waf/rate-limiting-rules/create-zone-dashboard/
- https://developers.cloudflare.com/bots/additional-configurations/static-resources/
- https://developers.cloudflare.com/waf/custom-rules/use-cases/challenge-bad-bots/
