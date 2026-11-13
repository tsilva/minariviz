# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project: minariviz

*Add project-specific instructions here.*

## Maintenance

README.md must be kept up to date with any significant project changes.

## Secrets

Keep local Sentry source-map uploads disabled and preserve the existing hosted
Production upload path. Trusted Production synchronization is separate from
ordinary development; never use it as a local credential fallback.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
