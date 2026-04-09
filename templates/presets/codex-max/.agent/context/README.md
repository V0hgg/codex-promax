# Agent Context Cache

This directory is the shared memory layer for repository-grounded discoveries that should survive across sessions and across agents.

Use it to store short, high-confidence notes about:

- repository structure and execution paths
- important commands and validation rituals
- stable architecture facts
- debugging findings that are likely to matter again

## Read Before Rediscovering

Before exploring a service, module, API, or workflow, check whether a relevant note already exists here. Reuse recent high-confidence notes instead of redoing the same exploration.

## Update When Knowledge Becomes Durable

Add or refresh a note when you confirm behavior through code, tests, docs, runtime output, or diffs. Keep notes short, practical, and easy to scan.

## Suggested Naming

Use lowercase kebab-case filenames that describe the surface being documented. Good examples:

- `repo-overview.md`
- `commands.md`
- `testing.md`
- `billing-api.md`
- `search-indexing.md`

## Recommended Note Shape

Use a compact structure like:

1. What this area does
2. Where the important files live
3. How to validate changes
4. Open risks or stale assumptions

Prefer updating an existing note over creating near-duplicates.
