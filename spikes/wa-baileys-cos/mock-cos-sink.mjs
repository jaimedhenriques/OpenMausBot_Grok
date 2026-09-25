#!/usr/bin/env node
/**
 * Mock CoS sink — proves adapter → webhook shape without a full harness.
 * Accepts the same path family as server/webhook-ingress.ts:
 *   POST /hooks/:endpointId[/:secret]
 * Also: GET /health, GET /cos/inbox (recorded turns).
 *
 * SPIKE ONLY. Not production. No BlueBubbles / iMessage here (HOLD Soft CEO→CoS→Chair).
 */
import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { summarizeForCos } from "./envelope.mjs";

const PORT = Number(process.env.SPIKE_SINK_PORT || 18800);
const HOST = process.env.SPIKE_SINK_HOST || "127.0.0.1";
const ENDPOINT_ID = process.env.SPIKE_ENDPOINT_ID || "wh_spike_wa_cos";
const SECRET = process.env.SPIKE_WEBHOOK_SECRET || "spike-secret-not-for-prod";

/** @type {Array<Record<string, unknown>>} */
const inbox = [];

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function bearer(req) {
  const auth = req.headers.authorization ?? "";
  const m = String(auth).match(/^Bearer\s+(.+)$/i);
  return (m?.[1] || req.headers["x-openmaus-secret"] || "").toString().trim();
}

function secretsEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

async function readBody(req) {
  const chunks = [];
  let n = 0;
  for await (const c of req) {
    const b = Buffer.isBuffer(c) ? c : Buffer.from(c);
    n += b.length;
    if (n > 256 * 1024) throw Object.assign(new Error("body too large"), { status: 413 });
    chunks.push(b);
  }
  return Buffer.concat(chunks).toString("utf8");
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);

  if (req.method === "GET" && url.pathname === "/health") {
    return json(res, 200, {
      app: "spike-wa-baileys-cos-sink",
      ready: true,
      cos: "mock",
      inboxCount: inbox.length,
      endpointId: ENDPOINT_ID,
    });
  }

  if (req.method === "GET" && url.pathname === "/cos/inbox") {
    return json(res, 200, { turns: inbox });
  }

  const match = url.pathname.match(/^\/hooks\/(wh_[A-Za-z0-9_-]+)(?:\/([^/]+))?$/);
  if (!match) return json(res, 404, { error: "Unknown spike endpoint" });
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });

  const endpointId = match[1];
  const pathSecret = match[2] ? decodeURIComponent(match[2]) : "";
  const secret = pathSecret || bearer(req);

  if (endpointId !== ENDPOINT_ID || !secretsEqual(secret, SECRET)) {
    return json(res, 401, { error: "Invalid webhook URL or secret" });
  }

  try {
    const raw = await readBody(req);
    const contentType = (req.headers["content-type"] || "application/json").split(";")[0].trim();
    let payload = {};
    if (raw) {
      if (contentType.includes("json")) payload = JSON.parse(raw);
      else payload = { raw };
    }

    const deliveryId =
      (req.headers["idempotency-key"] ||
        req.headers["x-webhook-id"] ||
        req.headers["webhook-id"] ||
        `spike-${Date.now()}`).toString();

    const summary = summarizeForCos(payload);
    const turn = {
      kind: "cos.mock.inbound",
      at: new Date().toISOString(),
      deliveryId,
      endpointId,
      summary,
      payload,
    };
    inbox.push(turn);
    // Cap memory for long-running demos
    if (inbox.length > 200) inbox.shift();

    console.log(
      `[mock-cos] delivery=${deliveryId} ok=${summary.ok} from=${summary.from ?? "?"} thread=${summary.threadKey ?? "?"} preview=${JSON.stringify(summary.preview ?? summary.reason)}`,
    );

    return json(res, 202, {
      accepted: true,
      deliveryId,
      duplicate: false,
      cos: "mock",
      summary,
    });
  } catch (err) {
    const status = err?.status || 400;
    return json(res, status, { error: err instanceof Error ? err.message : String(err) });
  }
});

server.listen(PORT, HOST, () => {
  const base = `http://${HOST}:${PORT}`;
  console.log(`[mock-cos] listening ${base}`);
  console.log(`[mock-cos] POST ${base}/hooks/${ENDPOINT_ID}/<secret>`);
  console.log(`[mock-cos] GET  ${base}/health  |  ${base}/cos/inbox`);
  console.log(`[mock-cos] secret env SPIKE_WEBHOOK_SECRET (default spike-secret-not-for-prod)`);
  console.log(`[mock-cos] SPIKE ONLY — unofficial WA; BlueBubbles/iMessage HOLD`);
});
