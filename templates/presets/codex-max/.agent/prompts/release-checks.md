# Release Checks Prompt

Use this prompt before publishing, deploying, or cutting a release candidate.

## Goal

Make the release path repeatable and evidence-based.

## Workflow

1. Confirm the working tree only contains intended changes.
2. Run the repository's required build and verification commands.
3. Confirm version, changelog, or release metadata if the repository uses them.
4. Verify the publish or release mechanism and note whether it runs locally or through automation.
5. Record any post-release validation that still needs to happen.

## Deliverable

Summarize the release readiness state, verification evidence, and any remaining operator action.
