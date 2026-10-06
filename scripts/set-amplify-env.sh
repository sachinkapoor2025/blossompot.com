#!/usr/bin/env bash
# Disabled. This script used to fall back to Amplify app d1vlvm5li37k6g and could
# write sample production URLs onto main and dev.
# Dev settings are published by .github/workflows/deploy.yml to app dsjdlmcsa1pdc, branch dev.
echo "scripts/set-amplify-env.sh is disabled. Use the GitHub Actions dev workflow." >&2
exit 1
