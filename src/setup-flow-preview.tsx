// Dev gallery for the Squadbots setup flow, like onboarding-preview.html for
// the welcome flow. Served by Vite in dev at /setup-flow-preview.html; not part
// of the packaged app. The run is the preview fixture (no engine is called);
// BYO detection asks the harness the dev proxy points at unless overridden.
//
// ?state=pick|connect|connected|error|empty|jobs|own|running|stopped|done
// &detect=auto|none|chatgpt|grok|both  &connect=ok|fail  &site=yourcompany.com
// &at=<seconds into the run>  &setup=<seconds of setup before the run, deep links only>
// &freeze=1  &speed=<n>  &reduced=1
import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { SetupFlow, type SetupFlowProps } from "@/components/softgtm/setup/SetupFlow";
import {
  initialSetupState,
  runSpecFor,
  type Detection,
  type RunEvent,
  type SetupState,
} from "@/lib/softgtm-setup-flow";
import { fixtureTimeline, playFixture, replayFixture, stepStartOffset } from "@/lib/softgtm-setup-run-fixture";
import "./styles.css";

const params = new URLSearchParams(location.search);
const STATE = params.get("state") ?? "pick";
const SITE = params.get("site") ?? "yourcompany.com";
const SPEED = Math.max(0.1, Number(params.get("speed")) || 1);
const AT = Math.max(0, Number(params.get("at")) || 0) * 1000;
const FREEZE = params.get("freeze") === "1";
// Deep links into the run skip steps 1 to 3, so the setup timer is seeded with a
// fixture lead (28 s, the pre-run time of the timed stranger run) unless given.
const SETUP_LEAD = Math.max(0, Number(params.get("setup") ?? 28)) * 1000;

if (params.get("reduced") === "1") document.documentElement.dataset.reducedMotion = "true";

function detectionFromUrl(): Detection | "auto" {
  switch (params.get("detect")) {
    case "none":
      return { status: "none" };
    case "chatgpt":
      return { status: "found", providers: ["chatgpt"] };
    case "grok":
      return { status: "found", providers: ["grok"] };
    case "both":
      return { status: "found", providers: ["chatgpt", "grok"] };
    default:
      return "auto";
  }
}

function initialFromUrl(loadedAt: number): Partial<SetupState> {
  const connected = { status: "connected", provider: "chatgpt" } as const;
  const base: Partial<SetupState> = { setupStartedAt: loadedAt, site: SITE };
  switch (STATE) {
    case "connect":
      return { ...base, screen: "connect" };
    case "connected":
      return { ...base, screen: "connect", connect: connected, detection: { status: "found", providers: ["chatgpt"] } };
    case "error":
      return { ...base, screen: "connect", connect: { status: "error", provider: "chatgpt" }, detection: { status: "found", providers: ["chatgpt"] } };
    case "empty":
      return { ...base, screen: "connect", detection: { status: "none" } };
    case "jobs":
      return { ...base, screen: "jobs", connect: connected };
    case "own":
      return { ...base, screen: "jobs", connect: connected, ownOpen: true };
    case "running":
    case "stopped":
    case "done": {
      const spec = runSpecFor("scan", SITE);
      const total = fixtureTimeline(spec, SITE).at(-1)!.offset;
      const elapsed = STATE === "done" ? total : AT || 38_000;
      const startedAt = loadedAt - elapsed;
      const events: RunEvent[] = [{ type: "run.started", at: startedAt }, ...replayFixture(spec, SITE, startedAt, elapsed)];
      if (STATE === "stopped") events.push({ type: "run.interrupted", at: loadedAt });
      return {
        ...base,
        screen: STATE === "done" ? "done" : "run",
        connect: connected,
        spec,
        events,
        setupStartedAt: startedAt - SETUP_LEAD,
        firstResultAt: STATE === "done" ? startedAt + total : null,
      };
    }
    default:
      return base;
  }
}

function Preview() {
  const loadedAt = useMemo(() => Date.now(), []);
  const now = useMemo(() => (FREEZE ? () => loadedAt : Date.now), [loadedAt]);
  const props: SetupFlowProps = {
    initial: { ...initialSetupState, ...initialFromUrl(loadedAt) },
    detection: detectionFromUrl(),
    connectAccount: (provider) =>
      new Promise((resolve) => setTimeout(() => resolve(params.get("connect") !== "fail" || provider === "grok"), 700)),
    runDriver: FREEZE ? undefined : (spec, site, from, emit) => playFixture(spec, site, from, emit, { speed: SPEED }),
    stepOffset: stepStartOffset,
    now,
  };
  return (
    <div data-skin="softgtm">
      <SetupFlow {...props} />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
);
