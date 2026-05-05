# Veloran Agent Install Guide

This guide is the source of truth for coding agents that are asked to install Veloran in an existing repository.

## Goal

Set up Veloran end-to-end in the current repository with minimal user effort and without unnecessary prompts.

## Workflow

1. Work from the current repository root. If the user pasted the install prompt in a nested folder, detect the real repo root before running commands.
2. Inspect the repository briefly before changing anything. Reuse existing project structure and avoid inventing a second workflow when the repo already has one.
3. Prefer running Veloran with `npx -y veloran@latest` so no global install is required unless the environment clearly requires a different approach.
4. Run:

   ```bash
   npx -y veloran@latest init
   ```

5. Keep command output concise. Do not dump file-by-file scaffold logs unless the command fails or the user asks for them.
6. After init succeeds, run:

   ```bash
   npx -y veloran@latest doctor
   ```

7. If `.agent/prompts/integrate-local-telemetry.md` exists after init, open that file and carry out its instructions in the same repository. Do not stop after printing or locating the prompt if you can continue the setup yourself.
8. When wiring telemetry or runtime helpers, reuse the repository's real local dev, cluster, or bootstrap path instead of inventing a separate startup flow.
9. Ask the user only for truly missing information that cannot be inferred safely, such as required credentials, secrets, or the correct local start command when the repository does not make it discoverable.
10. Finish with a short summary that states:
    - whether Veloran was initialized successfully
    - whether `doctor` passed
    - whether telemetry setup was completed
    - the exact blocker, if anything is still missing

## Guardrails

- Do not make production or deployment changes just to enable local telemetry.
- Prefer local-only wrappers, local-only environment variables, and reuse of existing startup scripts.
- Do not use destructive git commands unless the user explicitly asks for them.
- Preserve existing user content in managed files when the tool supports it.
