// Squadbots 4-step setup flow: state, copy and the run model.
// Design: Figma "Setup flow" (file TnaoDUiUqhtebOiRs3YFt8), spec in the PR body.
// Run states follow the S-04 agent-state spec (Using tool, Interrupted, Done);
// every number on screen is derived here from timestamps, never typed in.

export type Provider = "chatgpt" | "grok";
export type SquadmateId = "researcher" | "chief" | "writer" | "sales";
export type JobId = "scan" | "audit" | "snapshot" | "own";
export type Screen = "pick" | "connect" | "jobs" | "run" | "done";

export const PROVIDER_NAME: Record<Provider, string> = { chatgpt: "ChatGPT", grok: "Grok" };
export const PROVIDER_SIGNUP: Record<Provider, { host: string; href: string }> = {
  chatgpt: { host: "chatgpt.com", href: "https://chatgpt.com" },
  grok: { host: "grok.com", href: "https://grok.com" },
};

export interface Squadmate {
  id: SquadmateId;
  name: string;
  role: string;
  /** avatar-lab squad face (squad-N) and its palette colour; faces only, no phase labels */
  avatar: { index: number; color: string };
}

// The four launch squadmates (Q7 answered by the Squadbots CEO); Researcher is the default.
// Faces: Researcher = squad-3 (magnifier), Chief of Staff = squad-6 (calendar),
// Content Writer = squad-7 (document folder), Sales Assistant = squad-2 (chart).
export const SQUADMATES: Squadmate[] = [
  { id: "researcher", name: "Researcher", role: "Market scans, competitor notes and sourced summaries", avatar: { index: 3, color: "#23c773" } },
  { id: "chief", name: "Chief of Staff", role: "Inbox triage, follow-ups and meeting prep", avatar: { index: 6, color: "#ed429f" } },
  { id: "writer", name: "Content Writer", role: "Posts, newsletters and landing copy in your voice", avatar: { index: 7, color: "#eebc23" } },
  { id: "sales", name: "Sales Assistant", role: "Lead lists, outreach drafts and CRM updates", avatar: { index: 2, color: "#3297f5" } },
];

export function squadmate(id: SquadmateId): Squadmate {
  return SQUADMATES.find((s) => s.id === id) ?? SQUADMATES[0]!;
}

/** Customer copy. Plain prose, no em dashes, no internal names. */
export const COPY = {
  wordmark: "squadbots",
  stepOf: (n: number) => `Step ${n} of 4`,
  doneLabel: "Done",
  // Time is shown as true elapsed time only, never a countdown or estimate.
  // "Setup time" = since step 1 first loaded; "Run time" = since the task started.
  cue: {
    setup: (clock: string) => `Setup time ${clock}`,
    firstResult: (clock: string) => `First result at ${clock} setup time`,
  },
  pick: {
    title: "Pick your first squadmate",
    subtitle: "Each squadmate has its own computer and one clear job. You can add more later.",
    cta: (name: string) => `Continue with ${name}`,
  },
  connect: {
    title: "Connect your AI account",
    subtitle:
      "Squadmates run on the ChatGPT or Grok plan you already pay for, so $29/month covers your squad, not a second AI bill.",
    useplan: (p: Provider) => `Use the ${PROVIDER_NAME[p]} plan you already have.`,
    found: (p: Provider) => `Found on this computer. Use the ${PROVIDER_NAME[p]} plan you already have.`,
    signedIn: (name: string) => `Signed in. ${name} will use this account.`,
    connect: "Connect",
    connecting: "Connecting…",
    connected: "Connected",
    tryAgain: "Try again",
    error: (p: Provider) => {
      const other = PROVIDER_NAME[p === "chatgpt" ? "grok" : "chatgpt"];
      return `Couldn’t connect. The ${PROVIDER_NAME[p]} sign-in window closed before it finished. Try again, or connect ${other} instead.`;
    },
    note: "You sign in on their site. Disconnect any time in Settings.",
    noAccount: "No ChatGPT or Grok account yet?",
    back: "Back",
    cta: "Choose a first job",
  },
  empty: {
    title: "Bring a ChatGPT or Grok account",
    subtitle:
      "Squadbots does not resell AI. Your squadmate runs on an account you own, which keeps the price at $29/month.",
    rowTitle: (p: Provider) => `Get ${PROVIDER_NAME[p]}`,
    rowBody: (p: Provider) => `Create an account at ${PROVIDER_SIGNUP[p].host}, then come back here.`,
    open: (p: Provider) => `Open ${PROVIDER_SIGNUP[p].host}`,
    note: (name: string) => `${name} and your progress are saved while you sign up.`,
    cta: "I have an account now",
  },
  jobs: {
    title: "Pick a first job",
    subtitle: (name: string) => `One tap starts it. ${name} works on its own computer and shows you each step.`,
    siteLabel: "Your website",
    sitePlaceholder: "yourcompany.com",
    siteHelp: "Jobs below are written for this site.",
    siteMissing: "Add your website first so the job knows where to look.",
    pickedFor: (site: string) => `Picked for ${site || "your site"}`,
    own: "Write my own task",
    ownHide: "Hide my own task",
    ownLabel: "Your task",
    ownPlaceholder: "For example: list the five newest posts on our blog…",
    ownCta: "Start task",
    back: "Back",
  },
  run: {
    title: (name: string) => `${name} is on it`,
    stoppedTitle: (n: number, m: number) => `Stopped at step ${n} of ${m}`,
    stoppedSubtitle: (name: string) => `${name} kept the finished steps. Nothing was sent anywhere.`,
    runningOn: (p: Provider) => `Running on your ${PROVIDER_NAME[p]} account`,
    runTime: (clock: string) => `Run time ${clock}`,
    stoppedAt: (clock: string) => `Run time ${clock}, stopped`,
    stop: "Stop task",
    stopLabel: (name: string) => `Stop ${name}`,
    stopHint: "Stop (Esc)",
    stoppedMid: "Stopped mid-step, may be partial",
    notStarted: "Not started",
    resume: "Resume from here",
    pickAnother: "Pick another job",
    computer: (name: string) => `${name}’s computer`,
    live: "Live",
    stopped: "Stopped",
    starting: "Opening the browser…",
    drafting: (noun: string) => `${noun}, drafting…`,
    announceStep: (n: number, m: number, label: string) => `Step ${n} of ${m}: ${label}`,
    announceStopped: (n: number, m: number) => `Stopped by you at step ${n} of ${m}`,
  },
  done: {
    title: (noun: string) => `Your ${noun.toLowerCase()} is ready`,
    subtitle: (name: string, duration: string) =>
      `${name}’s run time was ${duration}. Nothing was sent anywhere. It is yours to review.`,
    open: (noun: string) => `Open ${noun.toLowerCase()}`,
    another: "Run another job",
    announce: (noun: string) => `${noun} ready`,
    notWired: "Opening the brief is not connected in this preview yet.",
  },
  card: {
    title: "Your squad",
    updates: "Updates as you go",
    updated: "Updated",
    setUp: "Set up",
    engine: "Engine",
    jobs: "Starter jobs",
    approvals: "Approvals",
    computer: "Computer",
    lastResult: "Last result",
    approvalsValue: "Asks before anything is sent",
    computerValue: "Own browser and files, sandboxed",
    engineNext: "Connect in the next step",
    engineChecking: "Checking this computer…",
    engineWaiting: "Waiting for you to connect",
    engineConnecting: (p: Provider) => `Signing in to ${PROVIDER_NAME[p]}…`,
    engineError: "Not connected yet",
    engineNeeds: "Needs a ChatGPT or Grok account",
    engineDone: (p: Provider) => `${PROVIDER_NAME[p]}, your account`,
    jobsLater: "Picked once you connect",
    jobsNext: "Picked next",
    jobsNeedSite: "Add your website",
    jobsPicked: (n: number, site: string) => `${n} picked for ${site}`,
    jobsDone: "First job finished",
    lastResultValue: (noun: string) => `${noun}, ready to open`,
  },
} as const;

// ── Starter jobs and their plans ────────────────────────────────────────────

export interface ResultSection {
  title: string;
  body: string;
}

export interface RunSpec {
  job: JobId;
  /** "Brief", "Audit", "Snapshot", "Result" */
  noun: string;
  steps: string[];
  subtitle: string;
  result: { title: string; summary: string; sections: ResultSection[] };
}

export interface StarterJob {
  id: Exclude<JobId, "own">;
  icon: "compass" | "layout" | "globe";
  title: string;
  body: string;
}

// TODO(setup-flow): Q8 open. Per-job durations ("About 1 min") are not shown
// until they are measured on the BYO engines.
export const STARTER_JOBS: StarterJob[] = [
  { id: "scan", icon: "compass", title: "Scan 5 competitors", body: "A one-page brief on their pricing and pitch, with sources." },
  { id: "audit", icon: "layout", title: "Audit your homepage", body: "Five fixes that make your offer clearer, most important first." },
  { id: "snapshot", icon: "globe", title: "Draft a market snapshot", body: "Who buys, who sells and what is changing, with links." },
];

export function runSpecFor(job: JobId, site: string, ownTask = ""): RunSpec {
  switch (job) {
    case "scan":
      return {
        job,
        noun: "Brief",
        steps: [`Read ${site}`, "Find 5 competitors", "Compare pricing and positioning", "Write the one-page brief"],
        subtitle: `Scanning 5 competitors of ${site}. Each step shows here as it happens.`,
        result: {
          title: `Competitor brief: ${site}`,
          summary: "1 page, 5 competitors, sources linked",
          sections: [
            { title: "Who they are", body: "One line on each competitor, linked to their site." },
            { title: "How they price", body: "Plans and entry prices, taken from their own pricing pages." },
            { title: "Where you can win", body: "Three gaps your offer can use, with the evidence." },
          ],
        },
      };
    case "audit":
      return {
        job,
        noun: "Audit",
        steps: [`Read the ${site} homepage`, "Check the offer and the first screen", "Rank the fixes", "Write the audit"],
        subtitle: `Auditing the ${site} homepage. Each step shows here as it happens.`,
        result: {
          title: `Homepage audit: ${site}`,
          summary: "5 fixes, most important first",
          sections: [
            { title: "First screen", body: "What a new visitor reads first, and what it should say." },
            { title: "The offer", body: "Where the price and the promise get lost." },
            { title: "Next steps", body: "Each fix with the line to change." },
          ],
        },
      };
    case "snapshot":
      return {
        job,
        noun: "Snapshot",
        steps: [`Read ${site}`, "Map buyers and sellers", "Collect recent changes", "Write the snapshot"],
        subtitle: `Drafting a market snapshot for ${site}. Each step shows here as it happens.`,
        result: {
          title: `Market snapshot: ${site}`,
          summary: "Buyers, sellers and changes, with links",
          sections: [
            { title: "Who buys", body: "The buyers that fit your offer." },
            { title: "Who sells", body: "The sellers they already use." },
            { title: "What is changing", body: "Recent moves, each with a link." },
          ],
        },
      };
    case "own":
      return {
        job,
        noun: "Result",
        steps: ["Plan the task", "Work through it", "Write up the result"],
        subtitle: `Working on: ${ownTask.trim() || "your task"}. Each step shows here as it happens.`,
        result: {
          title: ownTask.trim() || "Your task",
          summary: "Written up for you to review",
          sections: [],
        },
      };
  }
}

// ── Run events (S-04 §4 vocabulary) ─────────────────────────────────────────

export type RunEvent =
  | { type: "run.started"; at: number }
  | { type: "step.start"; at: number; index: number }
  | { type: "tool.progress"; at: number; index: number; current: number; total: number; location: string }
  | { type: "step.end"; at: number; index: number }
  | { type: "run.completed"; at: number }
  | { type: "run.interrupted"; at: number };

export type StepStatus = "done" | "active" | "stopped" | "pending";

export interface RunRow {
  label: string;
  status: StepStatus;
  meta: string | null;
}

export interface RunView {
  status: "idle" | "running" | "stopped" | "done";
  rows: RunRow[];
  startedAt: number | null;
  elapsedMs: number;
  activeIndex: number;
  location: string | null;
  completedAt: number | null;
  /** 1-based step the run stopped on */
  stoppedStep: number | null;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s} sec`;
  if (s === 0) return `${m} min`;
  return `${m} min ${s} sec`;
}

export function deriveRunView(spec: RunSpec | null, events: RunEvent[], now: number): RunView {
  const empty: RunView = {
    status: "idle", rows: [], startedAt: null, elapsedMs: 0, activeIndex: -1,
    location: null, completedAt: null, stoppedStep: null,
  };
  if (!spec) return empty;
  const started = events.find((e) => e.type === "run.started");
  const completed = events.find((e) => e.type === "run.completed");
  const interrupted = completed ? undefined : events.find((e) => e.type === "run.interrupted");
  const startedAt = started?.at ?? null;
  const starts = new Map<number, number>();
  const ends = new Map<number, number>();
  const progress = new Map<number, Extract<RunEvent, { type: "tool.progress" }>>();
  for (const e of events) {
    if (e.type === "step.start") starts.set(e.index, e.at);
    if (e.type === "step.end") ends.set(e.index, e.at);
    if (e.type === "tool.progress") progress.set(e.index, e);
  }
  let activeIndex = -1;
  let stoppedStep: number | null = null;
  const rows: RunRow[] = spec.steps.map((label, index) => {
    if (ends.has(index)) {
      return { label, status: "done", meta: startedAt === null ? null : formatClock(ends.get(index)! - startedAt) };
    }
    if (starts.has(index)) {
      if (interrupted) {
        stoppedStep = index + 1;
        return { label, status: "stopped", meta: COPY.run.stoppedMid };
      }
      activeIndex = index;
      const p = progress.get(index);
      return { label, status: "active", meta: p ? `${p.current} of ${p.total}` : null };
    }
    return { label, status: "pending", meta: interrupted ? COPY.run.notStarted : null };
  });
  if (interrupted && stoppedStep === null) {
    // stopped between steps: the next unstarted step is where it stopped
    const next = rows.findIndex((r) => r.status === "pending");
    stoppedStep = next === -1 ? rows.length : next + 1;
  }
  const end = completed?.at ?? interrupted?.at ?? now;
  const location = activeIndex >= 0 ? progress.get(activeIndex)?.location ?? null : null;
  return {
    status: completed ? "done" : interrupted ? "stopped" : startedAt !== null ? "running" : "idle",
    rows,
    startedAt,
    elapsedMs: startedAt === null ? 0 : Math.max(0, end - startedAt),
    activeIndex,
    location,
    completedAt: completed?.at ?? null,
    stoppedStep,
  };
}

/** Index of the first step that has not finished: where Resume starts. */
export function resumeIndex(events: RunEvent[]): number {
  const ended = new Set(events.filter((e) => e.type === "step.end").map((e) => (e as { index: number }).index));
  let i = 0;
  while (ended.has(i)) i++;
  return i;
}

// ── BYO detection ───────────────────────────────────────────────────────────

export type Detection =
  | { status: "checking" }
  | { status: "found"; providers: Provider[] }
  | { status: "none" }
  | { status: "error" };

interface InstanceLike {
  driverKind: string;
  install?: unknown;
  access?: string;
  snapshot?: { state?: string; authenticated?: boolean };
}

const DRIVER_PROVIDER: Record<string, Provider> = { codex: "chatgpt", grok: "grok", grokAgent: "grok" };

/** Same readiness rule as EngineLibrary's engineReady: installed, available and signed in. */
export function detectProviders(instances: InstanceLike[]): Detection {
  const found = new Set<Provider>();
  for (const i of instances) {
    const provider = DRIVER_PROVIDER[i.driverKind];
    if (!provider) continue;
    const ready = i.snapshot?.state === "available" && (i.access === "custom" || i.snapshot?.authenticated !== false);
    if (ready) found.add(provider);
  }
  const providers = (["chatgpt", "grok"] as Provider[]).filter((p) => found.has(p));
  return providers.length ? { status: "found", providers } : { status: "none" };
}

// ── Flow state ──────────────────────────────────────────────────────────────

export type ConnectState =
  | { status: "idle" }
  | { status: "connecting"; provider: Provider }
  | { status: "connected"; provider: Provider }
  | { status: "error"; provider: Provider };

export interface SetupState {
  screen: Screen;
  squadmate: SquadmateId;
  detection: Detection;
  /** user said they have an account now: show the connect rows even if no CLI was found */
  emptyDismissed: boolean;
  /** user opened the no-account view by hand */
  emptyOpened: boolean;
  connect: ConnectState;
  site: string;
  siteMissing: boolean;
  ownOpen: boolean;
  ownTask: string;
  spec: RunSpec | null;
  events: RunEvent[];
  setupStartedAt: number | null;
  firstResultAt: number | null;
}

export const initialSetupState: SetupState = {
  screen: "pick",
  squadmate: "researcher",
  detection: { status: "checking" },
  emptyDismissed: false,
  emptyOpened: false,
  connect: { status: "idle" },
  site: "",
  siteMissing: false,
  ownOpen: false,
  ownTask: "",
  spec: null,
  events: [],
  setupStartedAt: null,
  firstResultAt: null,
};

export type SetupAction =
  | { type: "mount"; now: number }
  | { type: "select"; squadmate: SquadmateId }
  | { type: "goto"; screen: Screen }
  | { type: "detection"; detection: Detection }
  | { type: "openEmpty" }
  | { type: "haveAccount" }
  | { type: "connectStart"; provider: Provider }
  | { type: "connectOk"; provider: Provider }
  | { type: "connectFail"; provider: Provider }
  | { type: "site"; site: string }
  | { type: "siteMissing" }
  | { type: "toggleOwn" }
  | { type: "ownTask"; text: string }
  | { type: "startRun"; spec: RunSpec; now: number }
  | { type: "event"; event: RunEvent }
  | { type: "stop"; now: number }
  | { type: "resume" };

export type ConnectVariant = "default" | "connected" | "error" | "empty";

export function connectVariant(s: SetupState): ConnectVariant {
  if (s.connect.status === "connected") return "connected";
  if (s.connect.status === "error") return "error";
  if (s.emptyOpened) return "empty";
  if (!s.emptyDismissed && (s.detection.status === "none" || s.detection.status === "error")) return "empty";
  return "default";
}

export function setupReducer(s: SetupState, a: SetupAction): SetupState {
  switch (a.type) {
    case "mount":
      return s.setupStartedAt === null ? { ...s, setupStartedAt: a.now } : s;
    case "select":
      return { ...s, squadmate: a.squadmate };
    case "goto":
      return { ...s, screen: a.screen, siteMissing: false };
    case "detection":
      return { ...s, detection: a.detection };
    case "openEmpty":
      return { ...s, emptyOpened: true };
    case "haveAccount":
      return { ...s, emptyOpened: false, emptyDismissed: true, detection: { status: "checking" } };
    case "connectStart":
      return { ...s, connect: { status: "connecting", provider: a.provider } };
    case "connectOk":
      return { ...s, connect: { status: "connected", provider: a.provider }, emptyOpened: false };
    case "connectFail":
      return { ...s, connect: { status: "error", provider: a.provider } };
    case "site":
      return { ...s, site: a.site, siteMissing: false };
    case "siteMissing":
      return { ...s, siteMissing: true };
    case "toggleOwn":
      return { ...s, ownOpen: !s.ownOpen };
    case "ownTask":
      return { ...s, ownTask: a.text };
    case "startRun":
      return { ...s, screen: "run", spec: a.spec, events: [{ type: "run.started", at: a.now }] };
    case "event": {
      if (!s.spec) return s;
      const last = s.events[s.events.length - 1];
      if (last && (last.type === "run.completed" || last.type === "run.interrupted")) return s;
      const events = [...s.events, a.event];
      if (a.event.type === "run.completed") {
        return {
          ...s,
          events,
          screen: "done",
          firstResultAt: s.firstResultAt ?? a.event.at,
        };
      }
      return { ...s, events };
    }
    case "stop": {
      const last = s.events[s.events.length - 1];
      if (!s.spec || !last || last.type === "run.completed" || last.type === "run.interrupted") return s;
      return { ...s, events: [...s.events, { type: "run.interrupted", at: a.now }] };
    }
    case "resume": {
      // S-04 §5: re-queue from the last completed step with the same context.
      const from = resumeIndex(s.events);
      const events = s.events.filter((e) => {
        if (e.type === "run.interrupted") return false;
        if ((e.type === "step.start" || e.type === "tool.progress") && e.index >= from) return false;
        return true;
      });
      return { ...s, events };
    }
  }
}

/** Total time from the first screen to the first finished result. */
export function firstResultMs(s: SetupState): number | null {
  if (s.setupStartedAt === null || s.firstResultAt === null) return null;
  return s.firstResultAt - s.setupStartedAt;
}
