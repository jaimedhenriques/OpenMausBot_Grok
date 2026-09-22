import { MONTHLY_USD, TRIAL_DAYS } from "./softgtm-pricing";

/** Customer-facing Soft GTM strings. No em dashes (R-02). */
export const SOFT_GTM_HERO_TITLE = "Run a team of agents on your machine.";
export const SOFT_GTM_HERO_LEDE =
  "Each bot gets its own engine, folder, and computer when you need one. You approve risky steps. Bring your own model keys so work keeps going after a chat would stop.";

export const SOFT_GTM_PRIMARY_CTA = "Install OpenMausBot";
export const SOFT_GTM_SECONDARY_CTA = "Start hosted trial";

export function softGtmPricingFootnote(): string {
  return `${TRIAL_DAYS}-day Solo trial on the hosted app, then $${MONTHLY_USD}/mo BYO. Card required to start.`;
}

export const SOFT_GTM_502_JOIN =
  "Guest access on the hosted app is closed. Register with username, email, and phone, then start your Solo trial with a card before opening the app.";

export const SOFT_GTM_HOSTED_JOIN_URL = "https://app.squadbots.ai/join";
export const SOFT_GTM_DOCS_INSTALL_URL = "https://docs.openmausbot.com/docs/getting-started/installation";

export const SOFT_GTM_AVATAR_NAME = "Bramble";
export const SOFT_GTM_AVATAR_ROLE = "First bot";
export const SOFT_GTM_STATUS_WORKING = "Working";
export const SOFT_GTM_STATUS_THINKING = "Thinking";
export const SOFT_GTM_DEMO_LINE = "Checking the failing test before I propose a fix.";

/** Internal pack / Bot Board only. Do not render on customer Soft GTM chrome. */
export const SOFT_GTM_REVENUE_HONESTY = "Revenue unknown. £0 reported for this Soft GTM draft.";

/** Internal pack / Bot Board only. Do not render on customer Soft GTM chrome. */
export const SOFT_GTM_SEND_HOLD =
  "Soft GTM draft. No customer send. Apache-2.0 license unchanged.";
