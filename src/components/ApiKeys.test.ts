import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StoreProvider } from "@/state/store";
import * as store from "@/state/store";
import { ApiKeyRow, DeepSeekProviderPreset, OpenAiCompatUrl } from "./ApiKeys";
import en from "@/locales/en.json";

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const render = (element: React.ReactElement) => {
  vi.stubGlobal("window", {});
  return renderToStaticMarkup(createElement(StoreProvider, null, element));
};

describe("provider key rows", () => {
  it("states the bring-your-own provider and shared-inference boundary", () => {
    expect(en["keys.providers.subtitle"]).toContain("Bring your own provider connection");
    expect(en["keys.providers.subtitle"]).toContain("provider usage may cost money");
    expect(en["keys.providers.subtitle"]).toContain("No shared Squadbots inference or credits are included");
  });
  it("describes a stored key as configured without claiming an authenticated connection", () => {
    vi.spyOn(store, "useStore").mockReturnValue({
      state: { ...store.initialState, config: {
        ...store.initialState.config, openaiCompat: { configured: true, url: "https://openrouter.ai/api/v1" },
      } as store.ConfigStatus },
      dispatch: vi.fn(),
      flushBotPatches: vi.fn(),
      refreshInstances: vi.fn(),
      refreshModels: vi.fn(),
    });
    const html = render(createElement(ApiKeyRow, { section: "openaiCompat", testProvider: "openaiCompat" }));
    expect(html).toContain("Configured");
    expect(html).not.toContain("Connected");
    expect(html).not.toContain("authenticated");
    expect(html).toContain(">Test<");
    expect(html).toContain('value=""');
  });

  it("renders the provider rows write-only, with the provider's own console linked", () => {
    const anthropic = render(createElement(ApiKeyRow, { section: "anthropic", testProvider: "anthropic" }));
    expect(anthropic).toContain("Anthropic API key");
    expect(anthropic).toContain('type="password"');
    expect(anthropic).toContain("sk-ant-…");
    // The console link and the description live in the help popover.
    expect(anthropic).toContain('aria-label="About Anthropic API key"');
    expect(anthropic).not.toContain("Connected");
    // Nothing to test until a key is typed or saved.
    expect(anthropic).not.toContain(">Test<");

    const openai = render(createElement(ApiKeyRow, { section: "openaiCompat", testProvider: "openaiCompat" }));
    expect(openai).toContain("OpenAI-compatible API key");
    expect(openai).toContain("sk-or-v1-…");

    expect(render(createElement(ApiKeyRow, { section: "xai", testProvider: "xai" }))).toContain("xAI API key");
  });

  it("offers DeepSeek as a first-class BYO route without a shared key", () => {
    const html = render(createElement(DeepSeekProviderPreset));
    expect(html).toContain("DeepSeek API");
    expect(html).toContain("your own DeepSeek key");
    expect(html).toContain("billed by DeepSeek");
    expect(html).toContain("Squadbots policy and approval layer remains in control");
  });

  it("offers the base URL as a setting next to the key", () => {
    const html = render(createElement(OpenAiCompatUrl));
    expect(html).toContain("OpenAI-compatible base URL");
    expect(html).toContain('placeholder="https://openrouter.ai/api/v1"');
    expect(html).toContain("api.openai.com/v1");
  });
});
