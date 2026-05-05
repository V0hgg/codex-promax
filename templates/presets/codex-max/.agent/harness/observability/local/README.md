# Local Observability Overrides

Use this directory for machine-local files and reusable examples needed to connect a real repository to the Veloran observability stack.

Keep committed:

- wrapper scripts that are safe for the whole team
- service topology files that describe the local service graph
- example env files such as `*.example`
- setup notes that explain which secrets or credentials still need to be filled in

Suggested starting points:

- `service-topology.example.yaml`
- `cluster-up.example.sh`
- `cluster-down.example.sh`
- `env.local.example`

Keep uncommitted:

- real `.env` files
- machine-specific credentials
- temporary local overrides used only on one workstation
