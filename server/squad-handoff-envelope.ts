/**
 * Versioned metadata for a Squadbots teammate handoff.
 *
 * Design reference: CopilotKit/OpenBot's typed `message_bot` handoff semantics
 * at commit 61cc46ae021718ec6c19684b5a9f97ba57512baf, especially
 * docs/architecture.md ("One Bot handing work to another"). This is an
 * independent implementation over OpenMaus delegation records; no OpenBot
 * source code or runtime dependency is used.
 *
 * OpenMaus remains authoritative for roster visibility, peer grants, policy,
 * approvals, dispatch, cancellation and the provider session. An envelope is
 * context/provenance, never permission.
 */

import type { DelegationOutcome, DelegationReceipt } from "./delegations.ts";

export const SQUAD_HANDOFF_ENVELOPE_VERSION = "squad-handoff.v1" as const;
export const SQUAD_HANDOFF_V1_ENABLED = process.env.SQUADBOTS_TYPED_HANDOFF_V1 === "1";

export interface SquadHandoffEnvelopeV1 {
  version: typeof SQUAD_HANDOFF_ENVELOPE_VERSION;
  handoffId: string;
  source: { botId: string; threadId: string; name: string };
  target: { botId: string; threadId?: string; name?: string };
  assignment: {
    task: string;
    constraints: string[];
    expectedResult?: string;
  };
  delivery: {
    sourceThreadId: string;
    depth: number;
    originatingGroupId?: string;
  };
  authority: {
    /** Explicitly prevents metadata from being mistaken for a grant. */
    resolvedBy: "openmaus-runtime";
    grantsAndPolicy: "recheck-at-dispatch-and-return";
  };
  createdAt: string;
}

export interface SquadHandoffReturnV1 {
  version: typeof SQUAD_HANDOFF_ENVELOPE_VERSION;
  handoffId: string;
  sourceThreadId: string;
  target: { botId: string; name: string };
  outcome: DelegationOutcome;
  result?: string;
  finishedAt: string;
}

export interface LegacyHandoffInput {
  id: string;
  sourceBotId: string;
  sourceBotName: string;
  sourceThreadId: string;
  targetBotId: string;
  targetBotName?: string;
  targetThreadId?: string;
  task: string;
  constraints?: string[];
  expectedResult?: string;
  depth: number;
  originatingGroupId?: string;
  createdAt?: string;
}

/**
 * Disabled adapter seam. Callers must gate production use with
 * SQUAD_HANDOFF_V1_ENABLED. It does not resolve identities or authorize work;
 * those values must come from the already-authorized OpenMaus dispatch edge.
 */
export function legacyHandoffToEnvelope(input: LegacyHandoffInput): SquadHandoffEnvelopeV1 {
  const task = input.task.trim();
  if (!task) throw new Error("handoff task must not be empty");
  if (!Number.isSafeInteger(input.depth) || input.depth < 0) throw new Error("handoff depth must be a non-negative integer");
  const constraints = (input.constraints ?? []).map((value) => value.trim()).filter(Boolean);
  const envelope: SquadHandoffEnvelopeV1 = {
    version: SQUAD_HANDOFF_ENVELOPE_VERSION,
    handoffId: input.id,
    source: { botId: input.sourceBotId, threadId: input.sourceThreadId, name: input.sourceBotName },
    target: { botId: input.targetBotId },
    assignment: { task, constraints },
    delivery: { sourceThreadId: input.sourceThreadId, depth: input.depth },
    authority: { resolvedBy: "openmaus-runtime", grantsAndPolicy: "recheck-at-dispatch-and-return" },
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  if (input.targetBotName?.trim()) envelope.target.name = input.targetBotName.trim();
  if (input.targetThreadId?.trim()) envelope.target.threadId = input.targetThreadId.trim();
  if (input.expectedResult?.trim()) envelope.assignment.expectedResult = input.expectedResult.trim();
  if (input.originatingGroupId?.trim()) envelope.delivery.originatingGroupId = input.originatingGroupId.trim();
  return envelope;
}

/** Convert the existing durable receipt without changing delivery semantics. */
export function delegationReceiptToHandoffReturn(receipt: DelegationReceipt): SquadHandoffReturnV1 {
  const returned: SquadHandoffReturnV1 = {
    version: SQUAD_HANDOFF_ENVELOPE_VERSION,
    handoffId: receipt.id,
    sourceThreadId: receipt.sourceThreadId,
    target: { botId: receipt.toBotId, name: receipt.toBotName },
    outcome: receipt.status,
    finishedAt: new Date(receipt.finishedAt).toISOString(),
  };
  if (receipt.result !== undefined) returned.result = receipt.result;
  return returned;
}

/** Feature-gated wrapper used by the existing delegation edge. */
export function adaptLegacyHandoff(
  input: LegacyHandoffInput,
  enabled = SQUAD_HANDOFF_V1_ENABLED,
): SquadHandoffEnvelopeV1 | undefined {
  return enabled ? legacyHandoffToEnvelope(input) : undefined;
}

/** Feature-gated wrapper used by the existing delegated-return edge. */
export function adaptDelegationReturn(
  receipt: DelegationReceipt,
  enabled = SQUAD_HANDOFF_V1_ENABLED,
): SquadHandoffReturnV1 | undefined {
  return enabled ? delegationReceiptToHandoffReturn(receipt) : undefined;
}
