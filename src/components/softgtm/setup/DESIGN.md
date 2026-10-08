# Squadbots setup flow: DESIGN.md

Scope: the 4-step setup flow in `src/components/softgtm/setup/`, shown in the dev
gallery only (`setup-flow-preview.html`). It is **not mounted in first run**. Mounting
comes in a follow-up PR once real provider sign-in and harness run events are wired.

This file lives next to the flow, not at the repo root, so it does not collide with
the repo-wide DESIGN.md the UX stack wiring branch adds. Every value is read from
this repo. Nothing here is a new brand decision.

Direction: Figma "Squadbots setup" frames 3:2 (pick), 3:491 (connect error),
4:2 (starter jobs), 4:186 (running), 4:377 (done), plus the setup SPEC. Run and
Stop states follow S-04. Any approval prompt would follow S-05 (none appears here,
because starter jobs only read).

## Tokens (softgtm skin, `src/styles.css` `[data-skin="softgtm"]`, as they stand today)

| token | value | use in the flow |
|---|---|---|
| `--color-app` | `#efece4` | page ground |
| `--color-panel` | `#f7f4ec` | location line on the live card |
| `--color-raised` | `#ffffff` | cards, options, inputs |
| `--color-raised-hover` | `#ece6dc` | skeleton shimmer midpoint only |
| `--color-control` | `#e3ddd2` | icon tiles, skeleton bars |
| `--color-hairline` | `#c8c0b4` | card borders, dividers, progress track |
| `--color-ink` | `#1c1914` | text, primary button, selected ring, error message text |
| `--color-ink-secondary` | `#3a352c` | supporting text |
| `--color-maus-line` | `#6b6458` | muted text, input and radio borders (alias `--sf-muted`) |
| `--color-accent` / `--color-accent-ink` | `#1c1914` / `#efece4` | the one primary per step |
| `--color-focus` | `#1c1914` | focus ring: 2px, offset 2px, every interactive element |
| `--color-success` | `#2f704f` | done checks, the first-result cue |
| `--color-danger` | `#a83d48` | alert icon, missing-website message |
| `--font-sans` | system-ui stack | all text |
| `--radius-lg` / `--radius-xl` | 8px / 10px | controls / cards |

Flow-local values (in `setup-flow.css`, scoped to `.sf`):
- `--sf-danger-wash`: `color-mix(in srgb, var(--color-danger) 8%, var(--color-raised))`. Q1: kept local, no new token.
- `--sf-elevation`: `0 12px 32px -8px rgba(28,25,20,.08)`, the preview card only, removed under 640px. Q5: kept local.
- `--sf-ease`: `cubic-bezier(0.22, 1, 0.36, 1)`, the app's existing curve.

Measured text contrast: ink on app 14.8:1, ink-secondary on raised 12.2:1,
muted on app 4.96:1 (5.85 on raised), ink on danger wash 15+:1, danger icon on
wash 5.43:1, success on app 5.01:1.

**OPEN for UX (canonical-look pass), not chosen in this PR:**
- Font: the softgtm system-ui stack is used as it stands. Inter (Figma) vs Outfit (www) is UX's call.
- Shadow token: there is no repo shadow token; `--sf-elevation` stays local until UX names one.

## Primitives

- `primitives.tsx`: `SetupButton` (primary | link | back; md | sm) and `RadioCards`
  (radiogroup with roving tabindex and arrow keys). Hand-ported from shadcn/ui
  Button and RadioGroup (MIT) and restyled with the tokens above. They use no
  shadcn default radius, shadow or neutrals.
- `SetupParts.tsx`: `SetupShell` (top bar, progress, setup timer, main/aside, mobile
  sticky action bar), `SquadCard`, `PlanCard`, `LiveView`, `SquadFace`.
- `../avatar-lab/BotAvatar.tsx`: avatar-lab squad faces, ported as is from
  HelixAgents (`mybots/packages/ui-web/src/bot-avatar.tsx` and
  `apps/www/public/avatars/squad-N.png` at `5992f75c`, #459 carrying #389).
  They are used as **faces only**: no work/think/deliver labels, pills, captions
  or status dot. Motion stops under reduced motion.

Squadmate faces: Researcher = squad-3 (magnifier), Chief of Staff = squad-6
(calendar), Content Writer = squad-7 (document folder), Sales Assistant = squad-2 (chart).
Face states: idle on pick and setup, `thinking` while a step runs without a tool,
`working` while a tool is in use, idle when stopped, `success` (one settle) on done.

## Rules this flow keeps

- One quiet primary per step. Every other action is a text link.
- Time is true elapsed time only, never a countdown or estimate.
  - "Setup time m:ss" counts from step 1 first load.
  - "Run time m:ss" counts from task start.
  - Done shows "First result at m:ss setup time" in the header, and the run time in the subtitle.
- Every number on screen is derived from run events or the clock, never typed in.
- No eyebrows, no em dashes, no purple, no pills or stamps, no lone spinner.
- Errors are inline, with `role="alert"`, a danger wash, an alert icon and the message in ink. There is no red card border.
- Motion: 200 to 240ms fades on state change, `.98` press scale, the spinner and shimmer only while running, and the avatar's own state motion. All of it turns off under `prefers-reduced-motion` or `data-reduced-motion="true"`.
- Layout: 520 / 64 / 440 columns at desktop, stacked under 1100px, the 390 layout under 640px with a sticky bottom bar that reserves its own height.

## States

Drawn and built:
- pick
- connect: default, detected, connecting, connected, error
- none found: one plain next step
- starter jobs: missing website, own task
- running: thinking / using a tool
- stopped (S-04 Interrupted)
- done

Marked TODO (not drawn; S-04 does not define them for this flow):
- run stalled, reconnecting, failed mid-run, account disconnected, slow network (`SetupFlow.tsx`)
- pressed-and-held and disabled buttons (`primitives.tsx`)
- real provider sign-in (Q10)
- harness run events in place of `softgtm-setup-run-fixture.ts`
- Open brief wired to chat. The follow-ups (rerun every Monday, turn into a one-pager) live in that brief view, not on the done screen.
- first-run mounting (follow-up PR)
