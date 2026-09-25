/**
 * Thin WA → OpenMausBot webhook envelope (ADR option A+C).
 * Payload is treated as untrusted event data by server/webhooks.ts.
 */

/** @param {{ from: string, chatId: string, text: string, messageId?: string, pushName?: string, ts?: number }} msg */
export function buildWebhookPayload(msg) {
  const from = String(msg.from || "").trim();
  const chatId = String(msg.chatId || from).trim();
  const text = String(msg.text || "").trim();
  const messageId = String(msg.messageId || `wa-mock-${Date.now()}`).trim();
  const threadKey = `wa:${chatId}`;
  return {
    source: "whatsapp-personal-web",
    channel: "whatsapp",
    transport: "baileys-class",
    from,
    chatId,
    threadKey,
    text,
    messageId,
    pushName: msg.pushName ? String(msg.pushName).slice(0, 120) : undefined,
    receivedAt: msg.ts ?? Date.now(),
    // Authenticated webhook task path (when trigger prompt is empty):
    task: [
      "Inbound personal WhatsApp message for the section Chief of Staff.",
      `From: ${from}${msg.pushName ? ` (${msg.pushName})` : ""}`,
      `Thread: ${threadKey}`,
      "",
      text,
    ].join("\n"),
  };
}

/** @param {unknown} payload */
export function summarizeForCos(payload) {
  if (!payload || typeof payload !== "object") return { ok: false, reason: "non-object payload" };
  const p = /** @type {Record<string, unknown>} */ (payload);
  const text = typeof p.text === "string" ? p.text : typeof p.task === "string" ? p.task : "";
  if (!text.trim()) return { ok: false, reason: "empty text/task" };
  return {
    ok: true,
    source: p.source,
    channel: p.channel,
    from: p.from,
    threadKey: p.threadKey,
    messageId: p.messageId,
    preview: text.trim().slice(0, 280),
  };
}
