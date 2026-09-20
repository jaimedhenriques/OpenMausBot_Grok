# SquadHandoffEnvelope v1 experiment

Status: disabled. `SQUADBOTS_TYPED_HANDOFF_V1=1` is reserved for a later wiring PR; this change adds no runtime behavior.

The schema is an independent Squadbots implementation informed by the typed handoff semantics described in CopilotKit/OpenBot at commit `61cc46ae021718ec6c19684b5a9f97ba57512baf`, especially `docs/architecture.md` under "One Bot handing work to another": https://github.com/CopilotKit/OpenBot/blob/61cc46ae021718ec6c19684b5a9f97ba57512baf/docs/architecture.md#one-bot-handing-work-to-another

No OpenBot source code was copied and no CopilotKit dependency was added. OpenBot is MIT licensed: https://github.com/CopilotKit/OpenBot/blob/61cc46ae021718ec6c19684b5a9f97ba57512baf/LICENSE

The envelope carries a typed task, constraints, expected-result shape, source/target references, delivery depth and stable handoff ID. It explicitly carries no authority. Existing OpenMaus runtime code continues to resolve visible recipients, re-check peer grants/team access and policy at dispatch and return, own approvals/cancellation, and decide provider session replay.

The first fixtures mirror the two current delta-context failure scenarios: a second teammate return landing while the source's first revival turn is busy, and a return arriving after the source persona changed. The envelope keeps task IDs/results distinct and deliberately excludes provider session/persona state. These unit fixtures prove the seam's data semantics; they do not claim to fix the existing Windows timing failures until a later gated wiring PR runs the full end-to-end cases.
