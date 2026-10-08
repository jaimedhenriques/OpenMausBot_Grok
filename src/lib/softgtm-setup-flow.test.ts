import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  COPY,
  connectVariant,
  deriveRunView,
  detectProviders,
  firstResultMs,
  SQUADMATES,
  formatClock,
  formatDuration,
  initialSetupState,
  runSpecFor,
  setupReducer,
  type SetupAction,
  type SetupState,
} from "./softgtm-setup-flow";
import { replayFixture } from "./softgtm-setup-run-fixture";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const EM_DASH = /\u2014/;

function run(actions: SetupAction[], from: SetupState = initialSetupState): SetupState {
  return actions.reduce(setupReducer, from);
}

describe("setup flow formatters", () => {
  it("formats clocks and durations", () => {
    expect(formatClock(108_000)).toBe("1:48");
    expect(formatClock(9_400)).toBe("0:09");
    expect(formatDuration(72_000)).toBe("1 min 12 sec");
    expect(formatDuration(45_000)).toBe("45 sec");
    expect(formatDuration(120_000)).toBe("2 min");
  });
});

describe("BYO detection", () => {
  it("maps ready codex and grok engines to providers", () => {
    const d = detectProviders([
      { driverKind: "codex", snapshot: { state: "available", authenticated: true } },
      { driverKind: "grokAgent", snapshot: { state: "available" } },
      { driverKind: "claudeAgent", snapshot: { state: "available" } },
    ]);
    expect(d).toEqual({ status: "found", providers: ["chatgpt", "grok"] });
  });
  it("ignores engines that are missing or signed out", () => {
    expect(detectProviders([
      { driverKind: "codex", snapshot: { state: "unavailable" } },
      { driverKind: "grok", snapshot: { state: "available", authenticated: false } },
    ])).toEqual({ status: "none" });
  });
  it("none found shows the account step, never a dead end", () => {
    const s = run([{ type: "detection", detection: { status: "none" } }]);
    expect(connectVariant(s)).toBe("empty");
    const back = setupReducer(s, { type: "haveAccount" });
    expect(connectVariant(back)).toBe("default");
  });
});

describe("connect step", () => {
  it("moves through error and connected", () => {
    let s = run([{ type: "detection", detection: { status: "found", providers: ["chatgpt"] } }, { type: "connectStart", provider: "chatgpt" }]);
    s = setupReducer(s, { type: "connectFail", provider: "chatgpt" });
    expect(connectVariant(s)).toBe("error");
    s = setupReducer(s, { type: "connectOk", provider: "grok" });
    expect(connectVariant(s)).toBe("connected");
    expect(s.connect).toEqual({ status: "connected", provider: "grok" });
  });
  it("error copy names the failure and two ways forward", () => {
    expect(COPY.connect.error("chatgpt")).toContain("Try again, or connect Grok instead.");
  });
});

describe("run model", () => {
  const spec = runSpecFor("scan", "yourcompany.com");
  const t0 = 1_000_000;

  it("derives step times and progress from events", () => {
    const events = [{ type: "run.started" as const, at: t0 }, ...replayFixture(spec, "yourcompany.com", t0, 38_000)];
    const view = deriveRunView(spec, events, t0 + 38_000);
    expect(view.status).toBe("running");
    expect(view.rows.map((r) => r.meta)).toEqual(["0:09", "0:21", "3 of 5", null]);
    expect(view.rows.map((r) => r.status)).toEqual(["done", "done", "active", "pending"]);
    expect(view.location).toBe("Reading a pricing page, competitor 3 of 5");
    expect(formatClock(view.elapsedMs)).toBe("0:38");
  });

  it("stop interrupts at once and resume re-queues from the last finished step", () => {
    let s = run([
      { type: "mount", now: t0 - 30_000 },
      { type: "startRun", spec, now: t0 },
      ...replayFixture(spec, "yourcompany.com", t0, 38_000).map((event) => ({ type: "event" as const, event })),
      { type: "stop", now: t0 + 39_000 },
    ]);
    let view = deriveRunView(s.spec, s.events, t0 + 60_000);
    expect(view.status).toBe("stopped");
    expect(view.stoppedStep).toBe(3);
    expect(view.rows[2]).toMatchObject({ status: "stopped", meta: COPY.run.stoppedMid });
    expect(view.rows[3]).toMatchObject({ status: "pending", meta: COPY.run.notStarted });
    expect(formatClock(view.elapsedMs)).toBe("0:39");
    s = setupReducer(s, { type: "resume" });
    view = deriveRunView(s.spec, s.events, t0 + 61_000);
    expect(view.rows.map((r) => r.status)).toEqual(["done", "done", "pending", "pending"]);
  });

  it("setup timer starts at step 1 and stops at the first result", () => {
    const events = replayFixture(spec, "yourcompany.com", t0, 10_000_000);
    const s = run([
      { type: "mount", now: t0 - 36_000 },
      { type: "mount", now: t0 - 1_000 },
      { type: "startRun", spec, now: t0 },
      ...events.map((event) => ({ type: "event" as const, event })),
    ]);
    expect(s.screen).toBe("done");
    expect(formatClock(firstResultMs(s)!)).toBe("1:48");
    expect(formatDuration(deriveRunView(s.spec, s.events, t0 + 999_999).elapsedMs)).toBe("1 min 12 sec");
  });
});

describe("setup flow copy", () => {
  const sources = [
    "lib/softgtm-setup-flow.ts",
    "components/softgtm/setup/SetupFlow.tsx",
    "components/softgtm/setup/SetupParts.tsx",
    "components/softgtm/setup/primitives.tsx",
    "components/softgtm/avatar-lab/BotAvatar.tsx",
    "setup-flow-preview.tsx",
  ].map((p) => readFileSync(join(root, p), "utf8"));

  it("has no em dash in any setup source", () => {
    for (const src of sources) {
      expect(src).not.toMatch(EM_DASH);
    }
  });
  it("shows true elapsed time only, one label per measure", () => {
    const copy = JSON.stringify(COPY);
    expect(copy).not.toMatch(/About \d|to go|Under \d|min to your/);
    expect(COPY.cue.setup("0:42")).toBe("Setup time 0:42");
    expect(COPY.cue.firstResult("1:39")).toBe("First result at 1:39 setup time");
    expect(COPY.run.runTime("0:38")).toBe("Run time 0:38");
    expect(COPY.done.subtitle("Researcher", "1 min 12 sec")).toContain("run time was 1 min 12 sec");
    expect(COPY.done.subtitle("Researcher", "1 min 12 sec")).not.toContain("First result");
  });
  it("maps each launch squadmate to its own avatar-lab face", () => {
    expect(SQUADMATES.map((m) => m.name)).toEqual(["Researcher", "Chief of Staff", "Content Writer", "Sales Assistant"]);
    expect(new Set(SQUADMATES.map((m) => m.avatar.index)).size).toBe(4);
  });
  it("has no internal stamps in customer chrome", () => {
    for (const src of sources.slice(0, 4)) {
      expect(src).not.toMatch(/Soft GTM|DRAFT|Unknown\/£0/);
    }
  });
});
