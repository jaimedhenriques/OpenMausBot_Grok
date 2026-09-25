#!/usr/bin/env node
/**
 * Automated proof: mock inbound WA → webhook → mock CoS inbox.
 * No Baileys, no Meta paid reg, no harness required.
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const PORT = 18831;
const SECRET = "prove-secret";
const ENDPOINT = "wh_spike_wa_cos";
const env = {
  ...process.env,
  SPIKE_SINK_PORT: String(PORT),
  SPIKE_SINK_HOST: "127.0.0.1",
  SPIKE_WEBHOOK_SECRET: SECRET,
  SPIKE_ENDPOINT_ID: ENDPOINT,
};

const sink = spawn(process.execPath, [join(dir, "mock-cos-sink.mjs")], {
  env,
  stdio: ["ignore", "pipe", "pipe"],
});

let sinkLog = "";
sink.stdout.on("data", (d) => {
  sinkLog += d.toString();
});
sink.stderr.on("data", (d) => {
  sinkLog += d.toString();
});

function fail(msg) {
  console.error("PROVE FAIL:", msg);
  console.error(sinkLog.slice(-2000));
  sink.kill("SIGTERM");
  process.exit(1);
}

try {
  for (let i = 0; i < 40; i++) {
    try {
      const h = await fetch(`http://127.0.0.1:${PORT}/health`);
      if (h.ok) break;
    } catch {
      /* retry */
    }
    await sleep(50);
    if (i === 39) fail("sink did not become healthy");
  }

  const adapter = spawn(
    process.execPath,
    [
      join(dir, "adapter.mjs"),
      "--mock",
      "--url",
      `http://127.0.0.1:${PORT}`,
      "--endpoint",
      ENDPOINT,
      "--secret",
      SECRET,
      "--text",
      "prove: WA mock reached CoS sink",
      "--from",
      "15550001111",
    ],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  let aOut = "";
  adapter.stdout.on("data", (d) => {
    aOut += d.toString();
  });
  adapter.stderr.on("data", (d) => {
    aOut += d.toString();
  });
  const code = await new Promise((resolve) => adapter.on("close", resolve));
  if (code !== 0) fail(`adapter exit ${code}: ${aOut}`);

  const inboxRes = await fetch(`http://127.0.0.1:${PORT}/cos/inbox`);
  const inbox = await inboxRes.json();
  const turns = inbox.turns || [];
  const hit = turns.find(
    (t) => t?.summary?.ok && String(t.summary.preview || "").includes("prove: WA mock reached CoS sink"),
  );
  if (!hit) fail(`no matching CoS turn in inbox: ${JSON.stringify(inbox)}`);

  console.log("PROVE OK: inbound WA mock → webhook → mock CoS sink");
  console.log(
    JSON.stringify(
      {
        deliveryId: hit.deliveryId,
        from: hit.summary.from,
        threadKey: hit.summary.threadKey,
        preview: hit.summary.preview,
      },
      null,
      2,
    ),
  );
  sink.kill("SIGTERM");
  process.exit(0);
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}
