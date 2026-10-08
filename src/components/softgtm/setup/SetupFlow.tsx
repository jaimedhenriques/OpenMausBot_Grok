// Squadbots 4-step setup: pick a squadmate, connect your own ChatGPT or Grok
// (BYO), one-tap starter jobs, the first task running, task done. A stranger
// should reach a real result fast; the setup timer is live from step 1.
// Run states follow S-04 (Using tool, Interrupted on Stop, Done). No approval
// prompt appears in this flow because starter jobs only read; any approval
// would follow S-05.
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  CircleAlert,
  CircleCheck,
  Compass,
  ExternalLink,
  FileText,
  Globe,
  LoaderCircle,
  Lock,
  PanelsTopLeft,
  Repeat,
  Square,
} from "lucide-react";
import { api } from "@/state/store";
import { cn } from "@/lib/cn";
import {
  COPY,
  PROVIDER_NAME,
  PROVIDER_SIGNUP,
  SQUADMATES,
  STARTER_JOBS,
  connectVariant,
  deriveRunView,
  detectProviders,
  firstResultMs,
  formatClock,
  formatDuration,
  initialSetupState,
  runSpecFor,
  setupReducer,
  squadmate,
  type Detection,
  type JobId,
  type Provider,
  type RunEvent,
  type RunSpec,
  type SetupState,
} from "@/lib/softgtm-setup-flow";
import { RadioCards, SetupButton } from "./primitives";
import { LiveView, PlanCard, SetupShell, SquadCard, type CardRow } from "./SetupParts";
import "./setup-flow.css";

/** Drives a run: emits S-04 events from `fromOffset` ms into the plan. Returns cancel. */
export type RunDriver = (spec: RunSpec, site: string, fromOffset: number, emit: (e: RunEvent) => void) => () => void;

export interface SetupFlowProps {
  initial?: Partial<SetupState>;
  /** "auto" asks the harness which engines are installed and signed in */
  detection?: Detection | "auto";
  connectAccount?: (provider: Provider) => Promise<boolean>;
  runDriver?: RunDriver;
  /** where the driver resumes for a step (ms after run start) */
  stepOffset?: (spec: RunSpec, site: string, index: number) => number;
  now?: () => number;
  onOpenResult?: () => void;
  onFollowUp?: (kind: "rerun" | "onePager") => void;
}

// TODO(setup-flow): real provider sign-in (Q10 open). Until then the app has no adapter.
const NO_CONNECT = async () => false;

function cleanSite(raw: string): string {
  return raw.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function useTick(active: boolean, now: () => number): number {
  const [t, setT] = useState(now);
  useEffect(() => {
    if (!active) return;
    setT(now());
    const id = setInterval(() => setT(now()), 250);
    return () => clearInterval(id);
  }, [active, now]);
  return t;
}

const JOB_ICON = { compass: Compass, layout: PanelsTopLeft, globe: Globe } as const;

export function SetupFlow({
  initial,
  detection = "auto",
  connectAccount = NO_CONNECT,
  runDriver,
  stepOffset,
  now = Date.now,
  onOpenResult,
  onFollowUp,
}: SetupFlowProps) {
  const [state, dispatch] = useReducer(setupReducer, { ...initialSetupState, ...initial });
  const [runKey, setRunKey] = useState(0);
  const [announce, setAnnounce] = useState("");
  // Visible note for done-screen actions the host app has not wired yet, so no
  // button is silent for sighted users (antislop R-26).
  const [doneNote, setDoneNote] = useState("");
  const notWired = () => {
    setDoneNote(COPY.done.notWired);
    setAnnounce(COPY.done.notWired);
  };
  const siteRef = useRef<HTMLInputElement>(null);
  const ownRef = useRef<HTMLTextAreaElement>(null);
  const mate = squadmate(state.squadmate);
  const view = deriveRunView(state.spec, state.events, useTick(state.screen === "run", now));
  const running = view.status === "running";

  // Setup timer starts when step 1 is first shown (Q11).
  useEffect(() => {
    dispatch({ type: "mount", now: now() });
  }, [now]);

  // BYO detection: same source as the onboarding engines list.
  useEffect(() => {
    if (state.detection.status !== "checking") return;
    if (detection !== "auto") {
      dispatch({ type: "detection", detection });
      return;
    }
    let live = true;
    api<{ instances?: Parameters<typeof detectProviders>[0] }>("/api/instances", { signal: AbortSignal.timeout(6_000) })
      .then((d) => live && dispatch({ type: "detection", detection: detectProviders(d.instances ?? []) }))
      .catch(() => live && dispatch({ type: "detection", detection: { status: "error" } }));
    return () => {
      live = false;
    };
  }, [state.detection.status, detection]);

  // Run driver. runKey changes on start and resume.
  const driveFrom = useRef<number | null>(null);
  const cancelRun = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!runDriver || !state.spec || driveFrom.current === null) return;
    const cancel = runDriver(state.spec, cleanSite(state.site), driveFrom.current, (event) => dispatch({ type: "event", event }));
    cancelRun.current = cancel;
    return () => {
      cancel();
      cancelRun.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);
  useEffect(() => {
    if (view.status === "stopped" || view.status === "done") driveFrom.current = null;
  }, [view.status]);
  // A deep link that opens mid-run keeps playing from where it opened.
  useEffect(() => {
    if (state.screen === "run" && running && view.startedAt !== null && driveFrom.current === null && runKey === 0) {
      driveFrom.current = now() - view.startedAt + 1;
      setRunKey(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(
    (job: JobId) => {
      const site = cleanSite(state.site);
      if (job !== "own" && !site) {
        dispatch({ type: "siteMissing" });
        siteRef.current?.focus();
        return;
      }
      if (job === "own" && !state.ownTask.trim()) {
        ownRef.current?.focus();
        return;
      }
      const spec = runSpecFor(job, site || "your site", state.ownTask);
      dispatch({ type: "startRun", spec, now: now() });
      driveFrom.current = 0;
      setRunKey((k) => k + 1);
    },
    [state.site, state.ownTask, now],
  );

  const stop = useCallback(() => {
    // S-04 §5: instant, no confirm, Interrupted within 1 s.
    cancelRun.current?.();
    cancelRun.current = null;
    dispatch({ type: "stop", now: now() });
  }, [now]);

  const resume = () => {
    if (!state.spec) return;
    const index = view.stoppedStep ? view.stoppedStep - 1 : 0;
    dispatch({ type: "resume" });
    driveFrom.current = stepOffset ? stepOffset(state.spec, cleanSite(state.site), index) : 0;
    setRunKey((k) => k + 1);
  };

  // Esc stops the run when focus is not in a text field (S-04 §5).
  useEffect(() => {
    if (state.screen !== "run" || !running) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.key !== "Escape" || el?.closest("input, textarea, [role=dialog]")) return;
      e.preventDefault();
      stop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.screen, running, stop]);

  // One polite live region for state changes (S-04 §9). Timer is not announced.
  const total = state.spec?.steps.length ?? 0;
  useEffect(() => {
    if (!state.spec) return;
    if (view.status === "running" && view.activeIndex >= 0) {
      setAnnounce(COPY.run.announceStep(view.activeIndex + 1, total, state.spec.steps[view.activeIndex]!));
    } else if (view.status === "stopped" && view.stoppedStep) {
      setAnnounce(COPY.run.announceStopped(view.stoppedStep, total));
    } else if (view.status === "done") {
      setAnnounce(COPY.done.announce(state.spec.noun));
    }
  }, [view.status, view.activeIndex, view.stoppedStep, state.spec, total]);

  const connect = async (provider: Provider) => {
    dispatch({ type: "connectStart", provider });
    const ok = await connectAccount(provider).catch(() => false);
    dispatch({ type: ok ? "connectOk" : "connectFail", provider });
  };

  const engineFor = (p: Provider) => (state.connect.status === "connected" ? state.connect.provider : p);
  const baseRows = (engine: CardRow, jobs: CardRow): CardRow[] => [
    engine,
    jobs,
    { label: COPY.card.approvals, state: "done", text: COPY.card.approvalsValue },
    { label: COPY.card.computer, state: "done", text: COPY.card.computerValue },
  ];
  const liveRegion = (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {announce}
    </p>
  );

  // ── 01 Pick ──────────────────────────────────────────────────────────────
  if (state.screen === "pick") {
    return (
      <>
        <SetupShell
          screen="pick"
          step={1}
          cue={COPY.cue.pick}
          title={COPY.pick.title}
          subtitle={COPY.pick.subtitle}
          asideMobile="hidden"
          actions={
            <SetupButton onClick={() => dispatch({ type: "goto", screen: "connect" })}>
              {COPY.pick.cta}
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </SetupButton>
          }
          aside={
            <SquadCard
              mate={mate}
              note={COPY.card.updates}
              rows={baseRows(
                { label: COPY.card.engine, state: "pending", text: COPY.card.engineNext },
                { label: COPY.card.jobs, state: "pending", text: COPY.card.jobsLater },
              )}
            />
          }
        >
          <span id="sf-pick-label" className="sr-only">{COPY.pick.title}</span>
          <RadioCards
            labelledBy="sf-pick-label"
            value={state.squadmate}
            onChange={(id) => dispatch({ type: "select", squadmate: id })}
            options={SQUADMATES.map((m) => ({
              value: m.id,
              label: `${m.name}. ${m.role}`,
              render: (checked) => (
                <>
                  <span className="sf-avatar" aria-hidden="true">{m.letter}</span>
                  <span className="sf-option-text">
                    <span className="sf-strong">{m.name}</span>
                    <span className="sf-callout sf-ink2">{m.role}</span>
                  </span>
                  <span className={cn("sf-radio", checked && "is-on")} aria-hidden="true">
                    {checked ? <Check size={14} strokeWidth={2.5} /> : null}
                  </span>
                </>
              ),
            }))}
          />
        </SetupShell>
        {liveRegion}
      </>
    );
  }

  // ── 02 Connect (BYO) ─────────────────────────────────────────────────────
  if (state.screen === "connect") {
    const variant = connectVariant(state);
    const detected = state.detection.status === "found" ? state.detection.providers : [];
    const order: Provider[] = detected.length ? [...detected, ...(["chatgpt", "grok"] as Provider[]).filter((p) => !detected.includes(p))] : ["chatgpt", "grok"];
    const recommended = order[0]!;
    const c = state.connect;

    if (variant === "empty") {
      return (
        <>
          <SetupShell
            screen="connect-empty"
            step={2}
            cue={COPY.cue.connect}
            title={COPY.empty.title}
            subtitle={COPY.empty.subtitle}
            asideMobile="hidden"
            actions={
              <>
                <SetupButton onClick={() => dispatch({ type: "haveAccount" })}>{COPY.empty.cta}</SetupButton>
                <BackLink onClick={() => dispatch({ type: "goto", screen: "pick" })} />
              </>
            }
            aside={
              <SquadCard
                mate={mate}
                note={COPY.card.updates}
                rows={baseRows(
                  { label: COPY.card.engine, state: "pending", text: COPY.card.engineNeeds },
                  { label: COPY.card.jobs, state: "pending", text: COPY.card.jobsLater },
                )}
              />
            }
          >
            <div className="sf-list">
              {(["chatgpt", "grok"] as Provider[]).map((p) => (
                <div key={p} className="sf-account">
                  <div className="sf-account-row">
                    <span className="sf-option-text">
                      <span className="sf-strong">{COPY.empty.rowTitle(p)}</span>
                      <span className="sf-callout sf-ink2">{COPY.empty.rowBody(p)}</span>
                    </span>
                    <a className="sf-btn sf-btn--link sf-btn--sm" href={PROVIDER_SIGNUP[p].href} target="_blank" rel="noopener noreferrer">
                      {COPY.empty.open(p)}
                      <ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <p className="sf-note">
              <CircleCheck size={16} strokeWidth={2} className="sf-ic-muted" aria-hidden="true" />
              <span>{COPY.empty.note(mate.name)}</span>
            </p>
          </SetupShell>
          {liveRegion}
        </>
      );
    }

    const engineRow: CardRow =
      c.status === "connected"
        ? { label: COPY.card.engine, state: "done", text: COPY.card.engineDone(c.provider) }
        : c.status === "connecting"
          ? { label: COPY.card.engine, state: "active", text: COPY.card.engineConnecting(c.provider) }
          : c.status === "error"
            ? { label: COPY.card.engine, state: "error", text: COPY.card.engineError }
            : state.detection.status === "checking"
              ? { label: COPY.card.engine, state: "active", text: COPY.card.engineChecking }
              : { label: COPY.card.engine, state: "pending", text: COPY.card.engineWaiting };

    return (
      <>
        <SetupShell
          screen={`connect-${variant}`}
          step={2}
          cue={COPY.cue.connect}
          title={COPY.connect.title}
          subtitle={COPY.connect.subtitle}
          asideMobile={variant === "connected" ? "compact" : "hidden"}
          actions={
            variant === "connected" ? (
              <>
                <SetupButton onClick={() => dispatch({ type: "goto", screen: "jobs" })}>
                  {COPY.connect.cta}
                  <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                </SetupButton>
                <BackLink onClick={() => dispatch({ type: "goto", screen: "pick" })} />
              </>
            ) : (
              <BackLink onClick={() => dispatch({ type: "goto", screen: "pick" })} />
            )
          }
          aside={
            <SquadCard
              mate={mate}
              note={variant === "connected" ? COPY.card.updated : COPY.card.updates}
              rows={baseRows(engineRow, {
                label: COPY.card.jobs,
                state: "pending",
                text: variant === "connected" ? COPY.card.jobsNext : COPY.card.jobsLater,
              })}
            />
          }
        >
          <div className="sf-list">
            {order.map((p) => {
              const isConnected = c.status === "connected" && c.provider === p;
              const isError = c.status === "error" && c.provider === p;
              const isConnecting = c.status === "connecting" && c.provider === p;
              const primary = isError || isConnecting || (c.status === "idle" && p === recommended);
              return (
                <div key={p} className={cn("sf-account", isConnected && "is-selected", isError && "is-error")}>
                  <div className="sf-account-row">
                    <span className="sf-option-text">
                      <span className="sf-strong">{PROVIDER_NAME[p]}</span>
                      <span className="sf-callout sf-ink2">
                        {isConnected ? COPY.connect.signedIn(mate.name) : detected.includes(p) ? COPY.connect.found(p) : COPY.connect.useplan(p)}
                      </span>
                    </span>
                    {isConnected ? (
                      <span className="sf-status">
                        <CircleCheck size={16} strokeWidth={2} aria-hidden="true" />
                        {COPY.connect.connected}
                      </span>
                    ) : isConnecting ? (
                      <SetupButton size="sm" aria-busy="true" aria-label={`${COPY.connect.connecting} ${PROVIDER_NAME[p]}`}>
                        <LoaderCircle size={14} strokeWidth={2} className="sf-spin" aria-hidden="true" />
                        {COPY.connect.connecting}
                      </SetupButton>
                    ) : (
                      <SetupButton
                        size="sm"
                        variant={primary ? "primary" : "link"}
                        aria-label={`${isError ? COPY.connect.tryAgain : COPY.connect.connect} ${PROVIDER_NAME[p]}`}
                        onClick={() => void connect(p)}
                      >
                        {isError ? COPY.connect.tryAgain : COPY.connect.connect}
                      </SetupButton>
                    )}
                  </div>
                  {isError ? (
                    <p className="sf-inline-error" role="alert">
                      <CircleAlert size={16} strokeWidth={2} aria-hidden="true" />
                      <span>{COPY.connect.error(p)}</span>
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="sf-note">
            <Lock size={16} strokeWidth={2} className="sf-ic-muted" aria-hidden="true" />
            <span>{COPY.connect.note}</span>
          </p>
          {variant !== "connected" ? (
            <div>
              <SetupButton variant="link" size="sm" onClick={() => dispatch({ type: "openEmpty" })}>
                {COPY.connect.noAccount}
              </SetupButton>
            </div>
          ) : null}
        </SetupShell>
        {liveRegion}
      </>
    );
  }

  const provider = engineFor("chatgpt");
  const site = cleanSite(state.site);

  // ── 03 Starter jobs ──────────────────────────────────────────────────────
  if (state.screen === "jobs") {
    return (
      <>
        <SetupShell
          screen="jobs"
          step={3}
          cue={COPY.cue.jobs}
          title={COPY.jobs.title}
          subtitle={COPY.jobs.subtitle(mate.name)}
          asideMobile="hidden"
          actions={
            <>
              {state.ownOpen ? <SetupButton onClick={() => start("own")}>{COPY.jobs.ownCta}</SetupButton> : null}
              <BackLink onClick={() => dispatch({ type: "goto", screen: "connect" })} />
              <SetupButton variant="link" aria-expanded={state.ownOpen} onClick={() => dispatch({ type: "toggleOwn" })}>
                {state.ownOpen ? COPY.jobs.ownHide : COPY.jobs.own}
              </SetupButton>
            </>
          }
          aside={
            <SquadCard
              mate={mate}
              note={COPY.card.updates}
              rows={baseRows(
                { label: COPY.card.engine, state: "done", text: COPY.card.engineDone(provider) },
                site
                  ? { label: COPY.card.jobs, state: "done", text: COPY.card.jobsPicked(STARTER_JOBS.length, site) }
                  : { label: COPY.card.jobs, state: "pending", text: COPY.card.jobsNeedSite },
              )}
            />
          }
        >
          <div className="sf-field">
            <label htmlFor="sf-site" className="sf-callout sf-strong">{COPY.jobs.siteLabel}</label>
            <input
              id="sf-site"
              ref={siteRef}
              className="sf-input"
              inputMode="url"
              autoComplete="url"
              placeholder={COPY.jobs.sitePlaceholder}
              value={state.site}
              aria-invalid={state.siteMissing || undefined}
              aria-describedby="sf-site-help"
              onChange={(e) => dispatch({ type: "site", site: e.target.value })}
            />
            <p id="sf-site-help" className={cn("sf-callout", state.siteMissing ? "sf-danger" : "sf-ink2")} aria-live="polite">
              {state.siteMissing ? COPY.jobs.siteMissing : COPY.jobs.siteHelp}
            </p>
          </div>
          {state.ownOpen ? (
            <div className="sf-field">
              <label htmlFor="sf-own" className="sf-callout sf-strong">{COPY.jobs.ownLabel}</label>
              <textarea
                id="sf-own"
                ref={ownRef}
                className="sf-input sf-textarea"
                rows={3}
                placeholder={COPY.jobs.ownPlaceholder}
                value={state.ownTask}
                onChange={(e) => dispatch({ type: "ownTask", text: e.target.value })}
              />
            </div>
          ) : null}
          <div className="sf-jobs">
            <span id="sf-jobs-label" className="sf-caption">{COPY.jobs.pickedFor(site)}</span>
            <ul className="sf-list" aria-labelledby="sf-jobs-label">
              {STARTER_JOBS.map((job) => {
                const Icon = JOB_ICON[job.icon];
                return (
                  <li key={job.id}>
                    <button type="button" className="sf-job" onClick={() => start(job.id)}>
                      <span className="sf-tile" aria-hidden="true">
                        <Icon size={20} strokeWidth={2} />
                      </span>
                      <span className="sf-option-text">
                        <span className="sf-strong">{job.title}</span>
                        <span className="sf-callout sf-ink2">{job.body}</span>
                      </span>
                      <ArrowRight size={16} strokeWidth={2} className="sf-job-arrow" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </SetupShell>
        {liveRegion}
      </>
    );
  }

  const spec = state.spec ?? runSpecFor("scan", site || "your site");

  // ── 04 First task running / stopped ──────────────────────────────────────
  if (state.screen === "run") {
    const stopped = view.status === "stopped";
    const activeLabel = view.activeIndex >= 0 ? spec.steps[view.activeIndex]! : COPY.run.starting;
    // TODO(setup-flow): stalled, reconnecting, failed mid-run and account disconnected
    // mid-run states (S-04 §2, §3) are not drawn yet. Slow network is not drawn either.
    return (
      <>
        <SetupShell
          screen={stopped ? "run-stopped" : "run"}
          step={4}
          cue={stopped ? COPY.run.stopped : COPY.cue.run}
          title={stopped ? COPY.run.stoppedTitle(view.stoppedStep ?? 1, spec.steps.length) : COPY.run.title(mate.name)}
          subtitle={stopped ? COPY.run.stoppedSubtitle(mate.name) : spec.subtitle}
          asideMobile="stack"
          actions={
            stopped ? (
              <>
                <SetupButton onClick={resume}>{COPY.run.resume}</SetupButton>
                <SetupButton variant="link" onClick={() => dispatch({ type: "goto", screen: "jobs" })}>
                  {COPY.run.pickAnother}
                </SetupButton>
              </>
            ) : (
              <SetupButton variant="link" aria-label={COPY.run.stopLabel(mate.name)} title={COPY.run.stopHint} onClick={stop}>
                <Square size={14} strokeWidth={2} aria-hidden="true" />
                {COPY.run.stop}
              </SetupButton>
            )
          }
          aside={
            <LiveView
              name={mate.name}
              running={!stopped}
              noun={spec.noun}
              location={stopped ? COPY.run.announceStopped(view.stoppedStep ?? 1, spec.steps.length) : view.location ?? activeLabel}
            />
          }
        >
          <PlanCard rows={view.rows} />
          <div className="sf-meta">
            <span className="sf-meta-engine">
              <Lock size={14} strokeWidth={2} className="sf-ic-muted" aria-hidden="true" />
              {COPY.run.runningOn(provider)}
            </span>
            <span className="sf-tabular">
              {stopped ? COPY.run.stoppedAt(formatClock(view.elapsedMs)) : COPY.run.elapsed(formatClock(view.elapsedMs))}
            </span>
          </div>
        </SetupShell>
        {liveRegion}
      </>
    );
  }

  // ── 05 Done ──────────────────────────────────────────────────────────────
  const firstMs = firstResultMs(state);
  return (
    <>
      <SetupShell
        screen="done"
        step={5}
        cue={COPY.cue.firstResult(formatClock(firstMs ?? view.elapsedMs))}
        cueDone
        timerMs={firstMs}
        title={COPY.done.title(spec.noun)}
        subtitle={COPY.done.subtitle(mate.name, formatDuration(view.elapsedMs))}
        asideMobile="hidden"
        actions={
          <>
            <SetupButton
              onClick={() => {
                // TODO(setup-flow): wire to chat
                if (onOpenResult) onOpenResult();
                else notWired();
              }}
            >
              {COPY.done.open(spec.noun)}
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </SetupButton>
            <SetupButton variant="link" onClick={() => dispatch({ type: "goto", screen: "jobs" })}>
              {COPY.done.another}
            </SetupButton>
          </>
        }
        aside={
          <SquadCard
            mate={mate}
            note={COPY.card.setUp}
            rows={[
              { label: COPY.card.engine, state: "done", text: COPY.card.engineDone(provider) },
              { label: COPY.card.jobs, state: "done", text: COPY.card.jobsDone },
              { label: COPY.card.approvals, state: "done", text: COPY.card.approvalsValue },
              { label: COPY.card.lastResult, state: "done", text: COPY.card.lastResultValue(spec.result.title.split(":")[0]!) },
            ]}
          />
        }
      >
        <div className="sf-card sf-result">
          <div className="sf-result-head">
            <span className="sf-tile" aria-hidden="true">
              <FileText size={20} strokeWidth={2} />
            </span>
            <span className="sf-option-text">
              <span className="sf-strong">{spec.result.title}</span>
              <span className="sf-callout sf-ink2">{spec.result.summary}</span>
            </span>
          </div>
          {spec.result.sections.length ? (
            <>
              <hr className="sf-divider" />
              <dl className="sf-sections">
                {spec.result.sections.map((s) => (
                  <div key={s.title}>
                    <dt className="sf-callout sf-strong">{s.title}</dt>
                    <dd className="sf-callout sf-ink2">{s.body}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : null}
        </div>
        <div className="sf-followups">
          <span id="sf-next" className="sf-caption">{COPY.done.next}</span>
          <div className="sf-followup-links" role="group" aria-labelledby="sf-next">
            {/* TODO(setup-flow): wire follow-ups to routines and chat */}
            <SetupButton variant="link" size="sm" onClick={() => (onFollowUp ? onFollowUp("rerun") : notWired())}>
              <Repeat size={14} strokeWidth={2} aria-hidden="true" />
              {COPY.done.rerun}
            </SetupButton>
            <SetupButton variant="link" size="sm" onClick={() => (onFollowUp ? onFollowUp("onePager") : notWired())}>
              <FileText size={14} strokeWidth={2} aria-hidden="true" />
              {COPY.done.onePager}
            </SetupButton>
          </div>
          {doneNote ? <p className="sf-callout sf-ink2">{doneNote}</p> : null}
        </div>
      </SetupShell>
      {liveRegion}
    </>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <SetupButton variant="back" onClick={onClick}>
      <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
      {COPY.connect.back}
    </SetupButton>
  );
}
