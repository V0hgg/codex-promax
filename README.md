# execplans

Scaffold and validate ExecPlan workflows for AI coding assistants.

## Development

```bash
npm install
npm run ci
```

## CLI

```bash
npx -y execplans@latest init
```

Or after global install:

```bash
npm i -g execplans
execplans init
```

## Release workflow

- CI runs on pull requests and pushes to `main` via `.github/workflows/ci.yml`.
- To cut a release, run the `release` workflow manually and select `patch`, `minor`, or `major`.
- The `release` workflow now bumps version, updates changelog, pushes commit+tag, and publishes to npm in the same run.
- Publishing requires `NPM_TOKEN` repository secret.

Local release helpers:

```bash
npm run release:patch
# or npm run release:minor / npm run release:major
```
