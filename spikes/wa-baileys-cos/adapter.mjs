#!/usr/bin/env node
/**
 * Personal WA Web (Baileys-class) → OpenMausBot webhook → CoS.
 *
 * Modes:
 *   --mock     Simulate one inbound WA DM (default; no Baileys install required)
 *   --baileys  Optional live QR link via @whiskeysockets/baileys (opt-in install)
 *
 * Target can be:
 *   - this spike's mock-cos-sink.mjs
 *   - a real OpenMausBot webhook trigger pointed at the CoS bot
 *
 * Risks: unofficial protocol → ban / session drop. Personal account only. KEEP DRAFT.
 * BlueBubbles / iMessage: DO NOT START — HOLD Soft CEO→CoS→Chair (Mac+Apple ID 2FA).
 */
import { buildWebhookPayload } from "./envelope.mjs";

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  if (!next || next.startsWith("--")) return true;
  return next;
}

const mode = process.argv.includes("--baileys") ? "baileys" : "mock";
const baseUrl = (arg("--url") || process.env.SPIKE_WEBHOOK_URL || "http://127.0.0.1:18800").replace(/\/$/, "");
const endpointId = arg("--endpoint") || process.env.SPIKE_ENDPOINT_ID || "wh_spike_wa_cos";
const secret = arg("--secret") || process.env.SPIKE_WEBHOOK_SECRET || "spike-secret-not-for-prod";
const usePathSecret = process.argv.includes("--path-secret");

function endpointUrl() {
  if (usePathSecret) return `${baseUrl}/hooks/${endpointId}/${encodeURIComponent(secret)}`;
  return `${baseUrl}/hooks/${endpointId}`;
}

async function postInbound(msg) {
  const payload = buildWebhookPayload(msg);
  const headers = {
    "content-type": "application/json",
    "idempotency-key": payload.messageId,
    "x-webhook-event": "whatsapp.message",
    "user-agent": "openmausbot-spike-wa-baileys-cos/0.0.0",
  };
  if (!usePathSecret) headers.authorization = `Bearer ${secret}`;

  const res = await fetch(endpointUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const body = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = { raw: body };
  }
  if (!res.ok) {
    throw new Error(`webhook ${res.status}: ${body.slice(0, 500)}`);
  }
  console.log(`[adapter] forwarded messageId=${payload.messageId} thread=${payload.threadKey} → ${res.status}`, parsed);
  return parsed;
}

async function runMock() {
  const text =
    (typeof arg("--text") === "string" && arg("--text")) ||
    process.env.SPIKE_MOCK_TEXT ||
    "Chief: spike prove — personal WA Web path to CoS (draft)";
  const from = (typeof arg("--from") === "string" && arg("--from")) || "15551234567";
  const chatId = (typeof arg("--chat") === "string" && arg("--chat")) || `${from}@s.whatsapp.net`;

  console.log(`[adapter] mock inbound from=${from} → ${endpointUrl()}`);
  await postInbound({
    from,
    chatId,
    text,
    messageId: `wa-mock-${Date.now()}`,
    pushName: "Spike Tester",
  });
}

async function runBaileys() {
  let makeWASocket;
  let useMultiFileAuthState;
  let DisconnectReason;
  let qrcode;
  try {
    const baileys = await import("@whiskeysockets/baileys");
    makeWASocket = baileys.makeWASocket ?? baileys.default;
    useMultiFileAuthState = baileys.useMultiFileAuthState;
    DisconnectReason = baileys.DisconnectReason;
    if (typeof makeWASocket !== "function" || typeof useMultiFileAuthState !== "function") {
      throw new Error("Baileys exports missing makeWASocket / useMultiFileAuthState");
    }
  } catch (err) {
    if (String(err?.message || err).includes("Baileys exports missing")) {
      console.error("[adapter]", err.message);
      process.exit(2);
    }
    console.error(
      "[adapter] @whiskeysockets/baileys not installed.\n" +
        "  cd spikes/wa-baileys-cos && pnpm install\n" +
        "  Then re-run: node adapter.mjs --baileys\n" +
        "RISK: unofficial WA Web protocol — personal account ban / logout possible.",
    );
    process.exit(2);
  }
  try {
    qrcode = (await import("qrcode-terminal")).default;
  } catch {
    qrcode = null;
  }

  const authDir = process.env.SPIKE_BAILEYS_AUTH || new URL("./.auth", import.meta.url).pathname;
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: !qrcode,
  });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr && qrcode) {
      console.log("[adapter] Scan this QR with personal WhatsApp → Linked devices:");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "open") console.log("[adapter] WA Web linked (personal). Forwarding inbound text DMs → webhook.");
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.warn(`[adapter] connection closed code=${code}. Ban/session drop is a known unofficial risk.`);
      if (code !== DisconnectReason?.loggedOut) {
        console.warn("[adapter] Not auto-reconnecting in spike mode — restart manually if desired.");
      }
      process.exit(code === DisconnectReason?.loggedOut ? 1 : 0);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const m of messages) {
      if (m.key?.fromMe) continue;
      const chatId = m.key?.remoteJid;
      if (!chatId || chatId.endsWith("@g.us")) {
        // Groups out of spike scope unless SPIKE_ALLOW_GROUPS=1
        if (!process.env.SPIKE_ALLOW_GROUPS) continue;
      }
      const text =
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        "";
      if (!String(text).trim()) continue;
      const from = (chatId || "").replace(/@.*/, "");
      try {
        await postInbound({
          from,
          chatId,
          text: String(text),
          messageId: m.key?.id || `wa-${Date.now()}`,
          pushName: m.pushName,
          ts: (m.messageTimestamp ? Number(m.messageTimestamp) * 1000 : Date.now()),
        });
      } catch (err) {
        console.error("[adapter] forward failed:", err instanceof Error ? err.message : err);
      }
    }
  });
}

if (mode === "baileys") {
  await runBaileys();
} else {
  await runMock();
}
