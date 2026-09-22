import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const BANNED_DARK = /#08080A|bg-black|bg-\[#050506\]/;

describe("Soft GTM cream surfaces", () => {
  it("marketing CSS is cream, not near-black chrome", () => {
    const css = readFileSync(join(root, "components/softgtm/softgtm-marketing.css"), "utf8");
    expect(css).toContain("#efece4");
    expect(css).not.toMatch(BANNED_DARK);
  });

  it("softgtm skin block anchors on #EFECE4", () => {
    const styles = readFileSync(join(root, "styles.css"), "utf8");
    expect(styles).toMatch(/\[data-skin="softgtm"\][\s\S]*#efece4/i);
  });
});
