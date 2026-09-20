# DeepSeek Harness experiment

Status: disabled design and benchmark lane. `SQUADBOTS_EXPERIMENT_DEEPSEEK_HARNESS=false` is the only accepted default. This milestone does not install, start, or ship DeepSeek Harness.

## Source and provenance

- Upstream: https://github.com/deepseek-ai/deepseek-harness
- Reviewed revision: `ddefc45fbc7f8e46dd73185e68295696d1297887`
- Reviewed release: `dsh-v0.1.6-alpha.2`
- License: MIT. Preserve upstream copyright and license for any copied or distributed portion.
- Upstream status: developer preview, compatibility-breaking changes expected, no security audit. It is not a production isolation boundary.

## Boundary

OpenMaus remains the authoritative runtime. Its approvals, policy, model-cost ledger, redaction, delegation, computer routing, cancellation, and normalized events cannot be bypassed. A future experiment may invoke a pinned DeepSeek Harness SDK profile out of process in a disposable workspace. An adapter would translate its JSON-RPC/session stream into OpenMaus events and expose only OpenMaus-approved tools. It must not replace the main loop or inherit host credentials.

TypeSafe stays the evaluation-method layer. The disabled Jev design experiment remains separate. DeepSeek Harness is neither TypeSafe nor Jev.

## BYO provider contract

The current product route uses the existing write-only compatible-provider credential store:

- official endpoint: `https://api.deepseek.com`;
- credential: user-supplied DeepSeek API key, never returned after save;
- endpoint: replaceable for a compatible gateway or self-hosted route;
- models: discovered from the endpoint when supported or entered explicitly;
- validation: explicit user-triggered connection test;
- controls: replace key, remove key, replace endpoint, choose model;
- economics: DeepSeek/provider billing belongs to the user's provider account. Squadbots supplies no shared key or inference credits.

## Controlled benchmark

Run the same pinned task corpus through OpenMaus alone and through the disabled adapter. Record task success, tool correctness, time to first event, total latency, input/output tokens, provider-reported cost, cancellation and retry behavior, resume/event fidelity, approval bypass attempts, secret/redaction handling, repeat/loop behavior, failure recovery, and local-versus-cloud computer isolation. Use disposable workspaces and synthetic credentials in automated tests. A live canary needs a separately approved development key and cost cap.

Adopt only isolated MIT-compatible components that beat the current runtime and preserve notices. Do not enable the adapter by default, add a shared endpoint, merge, deploy, or publish as part of this experiment.
