# Spike (DRAFT): personal WhatsApp Web → webhook → CoS

**Status:** KEEP DRAFT — no production cutover, no merge mandate.  
**Lane:** `jaimedhenriques/OpenMausBot_Grok` (Muse / Soft CEO). Not squadbots. Not OpenMuse.  
**ADR direction:** PR #5 KEEP DRAFT (`docs/adr/muse-wa-imessage-cos-first.md` on `helix/adr-muse-wa-imessage-cos-first-2026-09-25`) — options **A + C**.  
**Out of scope this spike:** paid Meta WA Business; Apple messaging reg; **BlueBubbles / iMessage** (HOLD Soft CEO→CoS→Chair for Mac + Apple ID 2FA); DNS; Soft Taste / Critiquito / GTM.

## What “good” looks like

Thinnest path that proves an inbound personal WhatsApp message can reach an in-app CoS turn surface via the existing webhook envelope. A **mock CoS sink** is enough for the proof; pointing the same adapter at a real OpenMausBot webhook trigger (CoS bot id) is the next operator step, not a cutover.

## Layout

| File | Role |
| --- | --- |
| `envelope.mjs` | WA → webhook JSON (`from`, `threadKey`, `text`, `task`, …) |
| `mock-cos-sink.mjs` | Local `POST /hooks/wh_…` receiver that records CoS-bound turns |
| `adapter.mjs` | `--mock` simulated inbound, or `--baileys` optional live QR link |
| `prove-path.mjs` | Automated mock→sink proof (no Baileys, no Meta) |

## Run (mock proof — default)

```bash
cd spikes/wa-baileys-cos
node prove-path.mjs
# expect: PROVE OK: inbound WA mock → webhook → mock CoS sink
```

Manual two-process demo:

```bash
# terminal A
node mock-cos-sink.mjs
# terminal B
node adapter.mjs --mock --text "Chief, what's on the roster?"
# inspect
curl -s http://127.0.0.1:18800/cos/inbox | jq .
```

Env knobs: `SPIKE_SINK_PORT` (default `18800`), `SPIKE_ENDPOINT_ID` (`wh_spike_wa_cos`), `SPIKE_WEBHOOK_SECRET`, `SPIKE_WEBHOOK_URL`.

## Optional: live personal WA Web (Baileys-class)

Unofficial multi-device protocol. **Personal account only. Ban / forced logout risk.**

```bash
cd spikes/wa-baileys-cos
pnpm install   # pulls optional @whiskeysockets/baileys + qrcode-terminal
# terminal A: mock sink OR real OMB webhook base (127.0.0.1:8800 by default in app)
node mock-cos-sink.mjs
# terminal B
node adapter.mjs --baileys --url http://127.0.0.1:18800
# Scan QR in personal WhatsApp → Linked devices
```

Session files land in `spikes/wa-baileys-cos/.auth/` (gitignored). Do not commit. Do not use a primary business number.

### Pointing at real in-app CoS (operator, not cutover)

1. Run OpenMausBot so the webhook receiver is up (`127.0.0.1:8800` default).
2. Create a webhook trigger assigned to the **Chief of Staff** bot; copy endpoint id + secret once.
3. `SPIKE_WEBHOOK_URL=http://127.0.0.1:8800 SPIKE_ENDPOINT_ID=wh_… SPIKE_WEBHOOK_SECRET=… node adapter.mjs --mock` (then `--baileys` if accepted).
4. Confirm a turn appears on the CoS bot. No DNS / public ingress this pass (DNS HOLD).

## Risks (do not downplay)

| Risk | Notes |
| --- | --- |
| **Unofficial ban / session drop** | Baileys / WA Web is not a Meta-supported bot API. Personal accounts can be challenged or banned. Rate-limit; no blast sends. |
| ToS / grey area | Spike and lab only; Chairman before any business number. |
| Secrets | Capability URL or Bearer secret; Tailscale/local only; DNS HOLD. |
| Media / groups | Text DMs only in default spike; groups require `SPIKE_ALLOW_GROUPS=1`. |
| No multi-tenant SaaS | One personal link ≠ productized messaging. |

Paid WA Business / Cloud API / BSP = Soft CEO→CoS→Chairman only (ADR §F).

## HOLD — BlueBubbles / iMessage

**Do not start** BlueBubbles or any macOS iMessage relay in this PR. Requires Soft CEO→CoS→Chair (always-on Mac + Apple ID 2FA / recovery). Tracked in ADR option B only.

## Non-goals

- Merge / production cutover  
- Meta paid registration  
- Softbots→Squadbots brand work (squadbots tip only)  
- Expanding Squadbots PRs #1 / #2 / #4  
