# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project: minariviz

*Add project-specific instructions here.*

## Maintenance

README.md must be kept up to date with any significant project changes.

## Secrets

Default dev uses Infisical `minariviz` Development `/` through scripts/infisical/run.py. Use build:secrets for local Sentry uploads. Production uses `minariviz-production` Production `/` with a protected Vercel sync. Never print secret values or upload local credential files; retain Keychain originals until verified rotation.
