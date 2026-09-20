import { describe, expect, it } from "vitest";

import {
  SQUAD_HANDOFF_ENVELOPE_VERSION,
  adaptDelegationReturn,
  adaptLegacyHandoff,
  SQUAD_HANDOFF_V1_ENABLED,
  delegationReceiptToHandoffReturn,
  legacyHandoffToEnvelope,
} from "./squad-handoff-envelope.ts";

const fixture = (task: string) => legacyHandoffToEnvelope({
  id: "handoff-1",
  sourceBotId: "chief",
  sourceBotName: "Avery",
  sourceThreadId: "thread-source",
  targetBotId: "qa",
  targetBotName: "Mira",
  targetThreadId: "thread-target",
  task,
  constraints: [" Use the existing branch ", "Do not merge"],
  expectedResult: "A testable diagnosis",
  depth: 1,
  createdAt: "2026-09-20T19:00:00.000Z",
});

describe("SquadHandoffEnvelope v1 disabled adapter", () => {
  it("is disabled unless explicitly opted in", () => {
    expect(SQUAD_HANDOFF_V1_ENABLED).toBe(false);
    const input = earlyToInput(fixture("work"));
    expect(adaptLegacyHandoff(input)).toBeUndefined();
    expect(adaptLegacyHandoff(input, true)?.handoffId).toBe("handoff-1");
  });

  it("pins task, bounds, result shape, routing and non-authority", () => {
    expect(fixture("Investigate the replay race")).toEqual({
      version: SQUAD_HANDOFF_ENVELOPE_VERSION,
      handoffId: "handoff-1",
      source: { botId: "chief", threadId: "thread-source", name: "Avery" },
      target: { botId: "qa", threadId: "thread-target", name: "Mira" },
      assignment: {
        task: "Investigate the replay race",
        constraints: ["Use the existing branch", "Do not merge"],
        expectedResult: "A testable diagnosis",
      },
      delivery: { sourceThreadId: "thread-source", depth: 1 },
      authority: {
        resolvedBy: "openmaus-runtime",
        grantsAndPolicy: "recheck-at-dispatch-and-return",
      },
      createdAt: "2026-09-20T19:00:00.000Z",
    });
  });

  it("keeps two returns distinct when the busy source receives the second mid-turn", () => {
    const early = fixture("Check quality: QA_FACT_TOKEN");
    const late = legacyHandoffToEnvelope({
      ...earlyToInput(early), id: "handoff-2", targetBotId: "ops", targetBotName: "Jordan",
      task: "Check operations: OPS_FACT_TOKEN",
    });
    expect(early.handoffId).not.toBe(late.handoffId);
    expect(early.assignment.task).toContain("QA_FACT_TOKEN");
    expect(late.assignment.task).toContain("OPS_FACT_TOKEN");
    expect(early.delivery.sourceThreadId).toBe(late.delivery.sourceThreadId);
  });

  it("does not bind a return to stale persona/session state after a soul change", () => {
    const envelope = fixture("Check operations: OPS_SOUL_TOKEN");
    expect(envelope).not.toHaveProperty("sessionId");
    expect(envelope).not.toHaveProperty("persona");
    expect(envelope.authority.resolvedBy).toBe("openmaus-runtime");
    const receipt = {
      id: envelope.handoffId,
      sourceThreadId: envelope.delivery.sourceThreadId,
      toBotId: envelope.target.botId,
      toBotName: envelope.target.name!,
      status: "done",
      result: "OPS_SOUL_TOKEN",
      finishedAt: Date.parse("2026-09-20T19:01:00.000Z"),
    } as const;
    expect(adaptDelegationReturn(receipt)).toBeUndefined();
    const returned = delegationReceiptToHandoffReturn(receipt);
    expect(adaptDelegationReturn(receipt, true)).toEqual(returned);
    expect(returned).toMatchObject({
      handoffId: "handoff-1",
      sourceThreadId: "thread-source",
      outcome: "done",
      result: "OPS_SOUL_TOKEN",
    });
  });

  it("rejects an empty task and invalid depth", () => {
    expect(() => fixture("   ")).toThrow("handoff task must not be empty");
    expect(() => legacyHandoffToEnvelope({ ...earlyToInput(fixture("work")), depth: -1 })).toThrow("handoff depth");
  });
});

function earlyToInput(envelope: ReturnType<typeof fixture>) {
  return {
    id: envelope.handoffId,
    sourceBotId: envelope.source.botId,
    sourceBotName: envelope.source.name,
    sourceThreadId: envelope.source.threadId,
    targetBotId: envelope.target.botId,
    targetBotName: envelope.target.name,
    targetThreadId: envelope.target.threadId,
    task: envelope.assignment.task,
    constraints: envelope.assignment.constraints,
    expectedResult: envelope.assignment.expectedResult,
    depth: envelope.delivery.depth,
    createdAt: envelope.createdAt,
  };
}
