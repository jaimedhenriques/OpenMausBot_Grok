// Shell and cards for the Squadbots setup flow. Layout follows the Figma
// "Setup flow" frames: 520 + 64 + 440 on desktop, a single column under
// 1100px and the 390 mobile layout under 640px (see setup-flow.css).
import type { ReactNode } from "react";
import { Check, CircleAlert, CircleCheck, CircleDashed, Clock, Globe, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { COPY, type RunRow, type Squadmate } from "@/lib/softgtm-setup-flow";

export type AsideMode = "hidden" | "compact" | "stack";

export function SetupShell({
  step,
  cue,
  cueDone,
  timerMs,
  title,
  subtitle,
  children,
  actions,
  aside,
  asideMobile,
  screen,
}: {
  /** 1..4, or 5 for Done */
  step: number;
  cue: string;
  cueDone?: boolean;
  timerMs?: number | null;
  title: string;
  subtitle: string;
  children: ReactNode;
  actions: ReactNode;
  aside: ReactNode;
  asideMobile: AsideMode;
  screen: string;
}) {
  const label = step > 4 ? COPY.doneLabel : COPY.stepOf(step);
  const segments = [1, 2, 3, 4].map((n) => (
    <span key={n} className={cn("sf-seg", n <= step && "is-on")} aria-hidden="true" />
  ));
  const CueIcon = cueDone ? CircleCheck : Clock;
  const cueNode = (size: number) => (
    <span
      className={cn("sf-cue", cueDone && "is-done")}
      data-testid={cueDone ? "setup-timer" : undefined}
      data-ms={timerMs ?? undefined}
    >
      <CueIcon size={size} strokeWidth={2} aria-hidden="true" />
      <span>{cue}</span>
    </span>
  );
  return (
    <div className="sf" data-step={step} data-screen={screen}>
      <header className="sf-top">
        <span className="sf-brand">{COPY.wordmark}</span>
        <div className="sf-progress" role="group" aria-label={label}>
          <span className="sf-progress-label">{label}</span>
          <span className="sf-segs">{segments}</span>
        </div>
        <div className="sf-top-cue">{cueNode(16)}</div>
      </header>
      <div className="sf-mprogress">
        <span className="sf-segs">{segments}</span>
        {cueNode(14)}
      </div>
      <main className="sf-body">
        <section className="sf-main" key={screen}>
          <div className="sf-head">
            <h1 className="sf-title">{title}</h1>
            <p className="sf-subtitle">{subtitle}</p>
          </div>
          <div className="sf-content">{children}</div>
          <div className="sf-actions">{actions}</div>
        </section>
        <aside className="sf-aside" data-mobile={asideMobile}>
          {aside}
        </aside>
      </main>
      <div className="sf-bar">{actions}</div>
    </div>
  );
}

export type RowState = "done" | "pending" | "active" | "error";

export interface CardRow {
  label: string;
  state: RowState;
  text: string;
}

function RowIcon({ state, size = 16 }: { state: RowState; size?: number }) {
  if (state === "done") return <Check size={size} strokeWidth={2} className="sf-ic-success" aria-hidden="true" />;
  if (state === "active") return <LoaderCircle size={size} strokeWidth={2} className="sf-spin" aria-hidden="true" />;
  if (state === "error") return <CircleAlert size={size} strokeWidth={2} className="sf-ic-danger" aria-hidden="true" />;
  return <CircleDashed size={size} strokeWidth={2} className="sf-ic-muted" aria-hidden="true" />;
}

export function SquadCard({ mate, note, rows }: { mate: Squadmate; note: string; rows: CardRow[] }) {
  return (
    <div className="sf-card sf-card--preview">
      <div className="sf-card-head">
        <span>{COPY.card.title}</span>
        <span>{note}</span>
      </div>
      <div className="sf-identity">
        <span className="sf-avatar sf-avatar--lg" aria-hidden="true">{mate.letter}</span>
        <span className="sf-identity-text">
          <span className="sf-identity-name">{mate.name}</span>
          <span className="sf-callout sf-ink2">{mate.role}</span>
        </span>
      </div>
      <hr className="sf-divider" />
      <dl className="sf-rows">
        {rows.map((row) => (
          <div className="sf-row" key={row.label}>
            <dt className="sf-row-label">{row.label}</dt>
            <dd className={cn("sf-row-value", `is-${row.state}`)} key={`${row.state}-${row.text}`}>
              <RowIcon state={row.state} />
              <span>{row.text}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function PlanCard({ rows }: { rows: RunRow[] }) {
  return (
    <ol className="sf-card sf-plan">
      {rows.map((row, i) => (
        <li key={i} className={cn("sf-step", `is-${row.status}`)}>
          {row.status === "done" ? (
            <CircleCheck size={18} strokeWidth={2} className="sf-ic-success" aria-hidden="true" />
          ) : row.status === "active" ? (
            <LoaderCircle size={18} strokeWidth={2} className="sf-spin" aria-hidden="true" />
          ) : row.status === "stopped" ? (
            <CircleAlert size={18} strokeWidth={2} className="sf-ic-muted" aria-hidden="true" />
          ) : (
            <CircleDashed size={18} strokeWidth={2} className="sf-ic-muted" aria-hidden="true" />
          )}
          <span className="sf-step-label">{row.label}</span>
          {row.meta ? <span className="sf-step-meta">{row.meta}</span> : null}
          <span className="sr-only">
            {row.status === "done" ? ", done" : row.status === "active" ? ", in progress" : row.status === "stopped" ? ", stopped" : ", not started"}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function LiveView({
  name,
  running,
  location,
  noun,
}: {
  name: string;
  running: boolean;
  location: string;
  noun: string;
}) {
  return (
    <div className={cn("sf-card sf-card--preview sf-live", running && "is-running")}>
      <div className="sf-card-head">
        <span>{COPY.run.computer(name)}</span>
        <span className="sf-ink2">{running ? COPY.run.live : COPY.run.stopped}</span>
      </div>
      <div className="sf-location">
        <Globe size={14} strokeWidth={2} aria-hidden="true" />
        <span>{location}</span>
      </div>
      <span className="sf-caption">{COPY.run.drafting(noun)}</span>
      {/* Skeleton mirrors the shape of the finished result, not a spinner page. */}
      <div className="sf-skel" aria-hidden="true">
        <span style={{ width: 220, height: 14 }} />
        <span />
        <span />
        <span />
        <span style={{ width: 180 }} />
        <div className="sf-skel-table">
          {[0, 1, 2].map((r) => (
            <div key={r}>
              <span style={{ width: 96 }} />
              <span className="sf-skel-fill" />
              <span style={{ width: 56 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
