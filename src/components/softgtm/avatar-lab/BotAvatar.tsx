// Ported as-is from the avatar-lab squad set (work / think / deliver motion):
//   HelixAgents mybots/packages/ui-web/src/bot-avatar.tsx and
//   mybots/apps/www/public/avatars/squad-{2,3,6,7}.png
//   at 5992f75ccea40f9a990d2eacefc90db88cf09da6 (Soft GTM #459, which carries #389).
// HelixAgents is MIT (root LICENSE); the ui-web package is marked Apache-2.0,
// the same licence as this repo. Art is unchanged (byte-identical PNGs).
//
// Port changes, kept to the minimum:
// - images are bundled through Vite imports instead of /avatars/squad-N.png,
//   so they also resolve in the packaged app; only the four squad faces the
//   setup flow uses are ported (`SQUAD_AVATAR_SRC`).
// - an explicit `index` prop picks the face; `avatarIndex` is unchanged.
// - `--rk-page` (the www page token) falls back to the softgtm app colour.
// - the <img> carries width/height = size (web-design-guidelines: no CLS).
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import squad2 from "@/assets/avatar-lab/squad-2.png";
import squad3 from "@/assets/avatar-lab/squad-3.png";
import squad6 from "@/assets/avatar-lab/squad-6.png";
import squad7 from "@/assets/avatar-lab/squad-7.png";
import "./bot-avatar.css";

export type BotAvatarState =
  | "idle"
  | "thinking"
  | "working"
  | "executing"
  | "listening"
  | "speaking"
  | "success"
  | "needs-you"
  | "error";

const STATE_LABELS: Record<BotAvatarState, string> = {
  idle: "Ready",
  thinking: "Thinking",
  working: "Working",
  executing: "Tool requested",
  listening: "Listening",
  speaking: "Speaking",
  success: "Delivered",
  "needs-you": "Needs your input",
  error: "Needs attention",
};

/** The avatar-lab faces ported into this repo, by their squad-N number. */
export const SQUAD_AVATAR_SRC: Partial<Record<number, string>> = { 2: squad2, 3: squad3, 6: squad6, 7: squad7 };

export function avatarIndex(name: string, color?: string): number {
  if (color && /^#[0-9a-f]{6}$/i.test(color)) {
    const rgb = [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16));
    const palette = ["8558f7", "3297f5", "23c773", "15b5ae", "ff7d17", "ed429f", "eebc23"];
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;
    for (const [index, hex] of palette.entries()) {
      const candidate = [0, 2, 4].reduce(
        (sum, offset, channel) => sum + (Number.parseInt(hex.slice(offset, offset + 2), 16) - rgb[channel]!) ** 2,
        0,
      );
      if (candidate < distance) {
        nearest = index;
        distance = candidate;
      }
    }
    return nearest + 1;
  }
  let hash = 2166136261;
  for (const byte of new TextEncoder().encode(name)) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
  return (hash % 7) + 1;
}

export function BotAvatar({
  color,
  index,
  size = 38,
  state = "idle",
  name,
  className,
}: {
  color: string;
  /** squad-N face; must be one of SQUAD_AVATAR_SRC */
  index: number;
  size?: number;
  state?: BotAvatarState;
  name?: string;
  className?: string;
}) {
  const avatarRef = useRef<HTMLSpanElement>(null);
  const [motionVisible, setMotionVisible] = useState(false);

  useEffect(() => {
    const avatar = avatarRef.current;
    if (!avatar) return;
    let inViewport = false;
    const update = () => setMotionVisible(inViewport && !document.hidden);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            inViewport = entry?.isIntersecting ?? false;
            update();
          });
    observer?.observe(avatar);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  const style = {
    "--bot-color": color,
    "--bot-size": `${size}px`,
  } as CSSProperties;

  return (
    <span
      aria-label={name ? `${name}, ${STATE_LABELS[state]}` : STATE_LABELS[state]}
      className={cn("bot-avatar", className)}
      data-state={state}
      data-motion={motionVisible ? "running" : "paused"}
      ref={avatarRef}
      role="img"
      style={style}
    >
      <img
        aria-hidden="true"
        alt=""
        draggable={false}
        decoding="async"
        width={size}
        height={size}
        className="bot-avatar__shell"
        src={SQUAD_AVATAR_SRC[index] ?? SQUAD_AVATAR_SRC[3]}
      />
      <span aria-hidden="true" className="bot-avatar__status" />
    </span>
  );
}
