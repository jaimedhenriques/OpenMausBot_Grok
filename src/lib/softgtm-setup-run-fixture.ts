// PREVIEW FIXTURE. A scripted run feed so the setup flow can be seen and
// timed end to end without a live engine. It emits the same S-04 event
// vocabulary the harness will send; nothing here reaches a provider.
// TODO(setup-flow): replace with harness run events from /api/events (S-04 §4).
import type { RunEvent, RunSpec } from "./softgtm-setup-flow";

interface Beat {
  /** ms after the run started */
  offset: number;
  event: (at: number) => RunEvent;
}

const STEP_SECONDS: Record<RunSpec["job"], number[]> = {
  scan: [9, 12, 35, 16],
  audit: [8, 14, 18, 14],
  snapshot: [9, 15, 18, 16],
  own: [8, 30, 14],
};

function locationsFor(spec: RunSpec, index: number, site: string): { total: number; label: (n: number) => string } | null {
  if (spec.job === "scan" && index === 2) {
    return { total: 5, label: (n) => `Reading a pricing page, competitor ${n} of 5` };
  }
  if (index === 0) return { total: 1, label: () => `Reading ${site}` };
  return null;
}

/** The whole scripted run, as offsets from run start. */
export function fixtureTimeline(spec: RunSpec, site: string): Beat[] {
  const beats: Beat[] = [];
  const seconds = STEP_SECONDS[spec.job];
  let t = 0;
  spec.steps.forEach((_, index) => {
    const len = (seconds[index] ?? 10) * 1000;
    const start = t;
    beats.push({ offset: start, event: (at) => ({ type: "step.start", at, index }) });
    const loc = locationsFor(spec, index, site);
    if (loc) {
      for (let n = 1; n <= loc.total; n++) {
        const offset = start + Math.round(((n - 1) * len) / loc.total) + 1;
        beats.push({
          offset,
          event: (at) => ({ type: "tool.progress", at, index, current: n, total: loc.total, location: loc.label(n) }),
        });
      }
    }
    t += len;
    beats.push({ offset: t, event: (at) => ({ type: "step.end", at, index }) });
  });
  beats.push({ offset: t + 1, event: (at) => ({ type: "run.completed", at }) });
  return beats;
}

/** Events that would have happened by `elapsedMs` for a run that started at `startedAt`. */
export function replayFixture(spec: RunSpec, site: string, startedAt: number, elapsedMs: number): RunEvent[] {
  return fixtureTimeline(spec, site)
    .filter((b) => b.offset <= elapsedMs)
    .map((b) => b.event(startedAt + b.offset));
}

/** Offset (ms after run start) where step `index` begins. */
export function stepStartOffset(spec: RunSpec, site: string, index: number): number {
  const beat = fixtureTimeline(spec, site).find((b) => {
    const e = b.event(0);
    return e.type === "step.start" && e.index === index;
  });
  return beat?.offset ?? 0;
}

/**
 * Plays the scripted run in real time (divided by `speed`), emitting every beat
 * whose offset is at or after `fromOffset`. Returns a cancel function.
 */
export function playFixture(
  spec: RunSpec,
  site: string,
  fromOffset: number,
  emit: (event: RunEvent) => void,
  { speed = 1, now = () => Date.now() }: { speed?: number; now?: () => number } = {},
): () => void {
  const timers = fixtureTimeline(spec, site)
    .filter((b) => b.offset >= fromOffset)
    .map((b) => setTimeout(() => emit(b.event(now())), (b.offset - fromOffset) / speed));
  return () => timers.forEach(clearTimeout);
}
