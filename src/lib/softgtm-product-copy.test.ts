import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const BANNED = /\b(Jaime|Henriques|Fitch|Basel|XGS|Hythe)\b/i;
const EM_DASH = /\u2014/;

function quotedCustomerStrings(source: string): string[] {
  const out: string[] = [];
  for (const match of source.matchAll(/=\s*"([^"]*)"/g)) out.push(match[1]);
  for (const match of source.matchAll(/=\s*\n\s*"([^"]*)"/g)) out.push(match[1]);
  for (const match of source.matchAll(/return `([^`]*)`/g)) out.push(match[1]);
  return out;
}

describe("Soft GTM product copy", () => {
  const copySource = readFileSync(join(root, "lib/softgtm-product-copy.ts"), "utf8");
  const customerStrings = quotedCustomerStrings(copySource);

  it("customer strings have no banned personal names", () => {
    for (const line of customerStrings) {
      expect(line, line).not.toMatch(BANNED);
    }
  });

  it("customer strings have no em dash", () => {
    for (const line of customerStrings) {
      expect(line, line).not.toMatch(EM_DASH);
    }
  });

  it("Soft #502 honesty is present", () => {
    expect(copySource).toContain("Guest access on the hosted app is closed");
  });

  it("pricing shows $29 BYO", () => {
    const pricing = readFileSync(join(root, "lib/softgtm-pricing.ts"), "utf8");
    expect(pricing).toContain("29");
  });
});

describe("Soft GTM marketing hero — antislop rejects", () => {
  const hero = readFileSync(join(root, "components/softgtm/SoftGtmMarketingHero.tsx"), "utf8");

  it("uses cream #EFECE4 in stylesheet", () => {
    const css = readFileSync(join(root, "components/softgtm/softgtm-marketing.css"), "utf8");
    expect(css).toContain("#efece4");
    expect(css).not.toMatch(/#08080A|#050506/i);
  });

  it("has no eyebrow capsule or #455 cast chips", () => {
    expect(hero).not.toMatch(/eyebrow|squadmates-cast|cast__mate|data-squadmates/i);
    expect(hero).not.toMatch(/SPECIALIST|APPROVAL-FIRST/i);
  });

  it("does not render internal Soft GTM stamp copy", () => {
    expect(hero).not.toMatch(/SOFT_GTM_SEND_HOLD|SOFT_GTM_REVENUE_HONESTY/);
    expect(hero).not.toMatch(/Soft GTM draft|Revenue unknown|£0 reported/i);
    expect(hero).toContain("SOFT_GTM_502_JOIN");
    expect(hero).toContain("softGtmPricingFootnote");
    expect(hero).toContain('bodyId="blob"');
    expect(hero).toMatch(/size=\{11[2-9]\}|size=\{1[2-9]\d\}/);
  });
});
