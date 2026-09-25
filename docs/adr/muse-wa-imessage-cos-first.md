# ADR: Muse CoS on WhatsApp + iMessage first (no paid app registration)

- **Status:** Proposed (DRAFT PR — KEEP DRAFT; do not merge this pass)
- **Date:** 2026-09-25
- **SoT lane:** Muse-agent = `jaimedhenriques/OpenMausBot_Grok` (Soft CEO / Helix Muse)
- **Not this lane:** `jaimedhenriques/squadbots` (OpenMaus harness / Squadbots Rank-1 glass); OpenMuse / `helix-newco-agent` (CoS newco / CopilotKit)
- **Holds this pass:** Soft Taste / Critiquito / GTM / DNS; no paid WhatsApp Business API; no Apple Messages for Business / Apple messaging registration; brand Softbots→Squadbots scrub stays on squadbots tip only

## Context

OpenMausBot_Grok already has an in-app **Chief of Staff (CoS)** (`server/chief-of-staff.ts`): section lead, roster, `delegate_bot` / `ask_bot` / `coordinate_bots`, team setup proposals. In-repo "channels" are **bot rooms** (`docs/verification/channels.md`), not WhatsApp or iMessage. External turn injection already exists via **webhooks** (`server/webhooks.ts`, local receiver ~`:8800`). A local **stdio MCP** server can list bots/channels and send work while the desktop harness runs (`docs/mcp-server.md`). Native **iOS/Android companions** pair over HTTPS/Tailscale for chat/approvals — that is app UI, **not** iMessage.

Chairman / Soft CEO want CoS reachable from **WhatsApp + iMessage first**, with IDEAL later any Muse/Squadbots bot. MCP is nice-if-easy only. This ADR picks a path that does **not** require paid Meta WhatsApp Business or Apple business messaging registration this pass.

## Decision drivers

1. CoS on WA + iMessage **before** generalizing to every Muse/Squadbots bot.
2. **No** paid WA Business Cloud API / BSP spend this pass.
3. **No** Apple Messages for Business / Apple messaging registration this pass.
4. Prefer reuse of in-repo CoS + webhook/MCP surfaces over a parallel agent stack.
5. Soft Taste / Critiquito / GTM / DNS remain HOLD; KEEP DRAFT; no merge.
6. Escalate spend / 2FA / paid registration only Soft CEO → CoS → Chairman.

## Options (reach CoS without paid app registration)

### A. Personal WhatsApp Web / Baileys-class (recommended for WA)

- **What:** Link a **personal** WhatsApp account via multi-device / WA Web protocol (Baileys, whatsapp-web.js, or similar). Inbound DMs/groups → thin adapter → CoS bot turn (prefer webhook enqueue or harness send API); CoS replies → adapter → WA.
- **Pros:** No Meta Business API fee; QR link; matches "personal WA Web" constraint; can sit beside existing webhook receiver.
- **Cons / risks:** Unofficial protocol — ban/session drop risk; ToS grey area; media/group edge cases; needs durable session store + reconnect; not multi-tenant SaaS.
- **Needs later escalation:** If productizing at scale → paid WA Business / BSP (spend + compliance) → Soft CEO→CoS→Chairman.

### B. BlueBubbles / macOS iMessage relay (recommended for iMessage)

- **What:** Run BlueBubbles (or equivalent) on a **user-owned macOS** host with iMessage signed in; REST/webhook to CoS. Alternatives: other open macOS relays that expose iMessage without Apple business messaging APIs.
- **Pros:** No Apple Messages for Business registration; uses personal Apple ID already on a Mac; REST → fits webhook path.
- **Cons / risks:** Requires always-on Mac (Mac mini / existing Mac); Apple ID 2FA / device trust; relay security (token, LAN/Tailscale only); iMessage ToS / account risk if abused.
- **Needs later escalation:** Hardware spend, Apple ID 2FA recovery, any paid Apple messaging product → Soft CEO→CoS→Chairman.

### C. Webhook-only bridge (thin, recommended glue)

- **What:** Keep CoS inside OpenMausBot_Grok. External WA/iMessage adapters only HTTP POST to existing webhook triggers (or a small authenticated `/api/...` send) with a fixed prompt envelope: `from`, `channel`, `text`, `thread-key`.
- **Pros:** Minimal core churn; reuses `server/webhooks.ts` durability; CoS stays SoT for team logic.
- **Cons:** Adapter process is still out-of-band; need idempotent delivery IDs; mapping WA/iMessage threads ↔ OMB threads must be explicit.
- **Needs later escalation:** Public HTTPS for hooks beyond Tailscale/Funnel → DNS (HOLD this pass).

### D. MCP as CoS client (nice-if-easy only)

- **What:** Point an MCP client at the local OpenMausBot MCP (`docs/mcp-server.md`) so another process can list bots and send work to CoS.
- **Pros:** Already documented; good for Studio/CLI operators.
- **Cons:** Requires desktop/harness running + pairing token for mutating tools; not a phone-native UX; does not replace WA/iMessage transport.
- **Decision:** Optional side path; **not** the P0 delivery surface for strangers on WA/iMessage.

### E. Native iOS/Android companions only (insufficient for this goal)

- **What:** Ship/pair Muse mobile apps (`docs/ios-companion.md`, android tree).
- **Why not P0 alone:** Delivers app chat, **not** WhatsApp or iMessage threads. Keep as parallel Muse mobile track; do not conflate with iMessage.

### F. Paid WA Business Cloud API / Apple Messages for Business (explicitly out this pass)

- Official, scalable, billable. **Blocked** by Soft CEO order: no paid WA Business / Apple messaging registration this pass. Revisit only with Soft CEO→CoS→Chairman spend/reg approval.

### G. In-repo findings (2026-09-25 tip)

- CoS prompt + delegation: `server/chief-of-staff.ts`
- Bot rooms ≠ messaging networks: `docs/verification/channels.md`
- External inject: `server/webhooks.ts` + self-host webhook notes in `docs/self-hosting.md` / README
- MCP coordinate: `docs/mcp-server.md`
- **No** Baileys / BlueBubbles / WA Web / iMessage relay packages in this tip — adapters are greenfield beside the harness, not a rename of squadbots glass.

## Recommendation

**P0 path:** **A + B glued by C**

1. Stand up a **personal WA Web / Baileys-class** adapter → webhook → **CoS bot** (one section Chief).
2. Stand up a **BlueBubbles (or equivalent) macOS iMessage relay** → same webhook envelope → same CoS bot.
3. Map each external chat id to a durable OMB thread key; CoS owns outcomes and may `delegate_bot` / `ask_bot` as today.
4. Treat **MCP (D)** as operator nicety if pairing is already easy; do not block WA/iMessage on MCP.
5. Leave native companions (E) and any Muse/Squadbots "any bot" routing for **IDEAL later** once CoS-on-WA+iMessage is proven.
6. **Do not** open F this pass.

### Acceptance sketch (draft only — not implemented here)

- Human texts CoS on personal WhatsApp → CoS replies in-thread.
- Human texts CoS on iMessage (via BlueBubbles Mac) → CoS replies in-thread.
- CoS can still delegate to section bots; no paid Meta/Apple business messaging apps registered.
- Soft Taste / Critiquito / GTM / DNS untouched; ADR PR stays **draft**.

## Risks summary

| Risk | Mitigation |
| --- | --- |
| WA session ban / logout | Personal account only; rate-limit; clear "unofficial" label; Chairman before any business number |
| iMessage Apple ID lockout | Dedicated Mac + Apple ID; Tailscale-only relay; 2FA recovery with Chairman |
| Adapter security | Secrets once; no public DNS this pass (DNS HOLD); prefer Tailscale/Funnel |
| Conflating Muse fork with Squadbots rebrand | This ADR lives on OpenMausBot_Grok Muse lane only; PR #1 Squadbots rename HOLD |
| Scope creep to every bot | CoS-first; IDEAL later any Muse/Squadbots bot |

## Soft CEO → CoS → Chairman later (explicit)

Escalate **before** doing any of:

- Paid WhatsApp Business / Cloud API / BSP contracts or spend
- Apple Messages for Business or other Apple messaging **registration**
- New public DNS / domain for webhook ingress (DNS HOLD)
- Soft Taste / Critiquito / GTM SEND clearance
- Hardware purchase for always-on Mac if none exists
- 2FA / recovery changes on primary personal Apple ID or primary personal WA

## Non-goals this pass

- Merging this ADR PR
- Implementing adapters in this commit (docs-only)
- Softbots→Squadbots brand scrub on this fork (squadbots SoT only)
- Touching squadbots Rank-1 glass
- Paid messaging registrations

## Consequences

- Muse-agent SoT stays OpenMausBot_Grok with a clear CoS-first messaging ADR.
- Engineering can spike A/B/C behind draft approval without Meta/Apple paid app gates.
- Product claims for public GTM remain HOLD until Soft Taste / Critiquito CLEAR (separate lane).

## References

- `server/chief-of-staff.ts` — CoS system prompt and delegation contract
- `server/webhooks.ts` — durable external turn injection
- `docs/mcp-server.md` — optional MCP coordinate surface
- `docs/verification/channels.md` — in-app bot rooms (not WA/iMessage)
- `docs/ios-companion.md` — native companion ≠ iMessage
