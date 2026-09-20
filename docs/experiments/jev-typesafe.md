# Jev structured-decision experiment

Status: design-only, disabled by default.

## Purpose

Test whether a typed, confidence-bearing judgment can improve one bounded
Squadbots routing decision without weakening the existing OpenMaus policy,
approval, or action gates. The first candidate is read-only intent routing for
an already-received user message. It must not send, approve, spend, disclose,
or execute a tool.

## Boundary

The experiment sits behind `SQUADBOTS_EXPERIMENT_JEV=false`. Its adapter accepts
an immutable request and returns a schema-validated proposal:

```ts
type JevProposal = {
  route: "answer" | "research" | "ask" | "refuse";
  confidence: number;
  rationaleCode: string;
  modelVersion: string;
};
```

The proposal is advisory. Existing deterministic policy and approval checks run
after it and remain authoritative. Invalid schemas, timeouts, unavailable
providers, low confidence, or missing consent fall back to the current OpenMaus
path. No credential is stored in the repository. No TypeSafe/Jev API is called
unless an operator explicitly enables the flag in a non-production benchmark.

## Benchmark

Use a frozen, de-identified fixture set with expected routes and risk labels.
Compare the current router and the experiment on:

- exact route accuracy and false-action rate;
- calibration error and abstention quality;
- p50/p95 latency and per-decision cost;
- policy-gate bypass attempts, all of which must remain zero;
- deterministic fallback behavior during malformed responses and timeouts.

Promotion requires a reviewed benchmark report, zero approval/policy bypasses,
and a separate product decision. This document does not authorize production
traffic or make the experiment the default.
