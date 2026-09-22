import "./softgtm-marketing.css";
import { MausAvatar } from "@/components/Avatar";
import {
  SOFT_GTM_502_JOIN,
  SOFT_GTM_DOCS_INSTALL_URL,
  SOFT_GTM_HERO_LEDE,
  SOFT_GTM_HERO_TITLE,
  SOFT_GTM_HOSTED_JOIN_URL,
  SOFT_GTM_PRIMARY_CTA,
  SOFT_GTM_SECONDARY_CTA,
  SOFT_GTM_AVATAR_NAME,
  SOFT_GTM_AVATAR_ROLE,
  SOFT_GTM_DEMO_LINE,
  SOFT_GTM_STATUS_WORKING,
  softGtmPricingFootnote,
} from "@/lib/softgtm-product-copy";
import { brand } from "@/lib/brand";

type Props = {
  /** Preview pages can point CTAs at # anchors instead of live URLs. */
  installHref?: string;
  hostedJoinHref?: string;
};

export function SoftGtmMarketingHero({
  installHref = SOFT_GTM_DOCS_INSTALL_URL,
  hostedJoinHref = SOFT_GTM_HOSTED_JOIN_URL,
}: Props) {
  const product = brand().name;

  return (
    <div className="softgtm-marketing" data-softgtm-surface>
      <header className="softgtm-marketing__header">
        <span className="softgtm-marketing__wordmark">{product}</span>
      </header>

      <main className="softgtm-marketing__main">
        <section className="softgtm-marketing__hero" aria-labelledby="softgtm-hero-title">
          <div className="softgtm-marketing__copy">
            <h1 id="softgtm-hero-title">{SOFT_GTM_HERO_TITLE}</h1>
            <p className="softgtm-marketing__lede">{SOFT_GTM_HERO_LEDE}</p>
            <div className="softgtm-marketing__actions">
              <a className="softgtm-marketing__btn softgtm-marketing__btn--primary" href={installHref}>
                {SOFT_GTM_PRIMARY_CTA}
              </a>
              <a
                className="softgtm-marketing__btn softgtm-marketing__btn--secondary"
                href={hostedJoinHref}
                rel="noopener noreferrer"
              >
                {SOFT_GTM_SECONDARY_CTA}
              </a>
            </div>
            <p className="softgtm-marketing__offer">{softGtmPricingFootnote()}</p>
            <p className="softgtm-marketing__502">{SOFT_GTM_502_JOIN}</p>
          </div>

          <aside
            className="softgtm-marketing__stage"
            aria-label="Simulated first bot at work"
            data-avatar-lab
            data-motion="soft"
          >
            <div className="softgtm-marketing__computer">
              <p className="softgtm-marketing__sim-label">Simulated workspace</p>
              <p className="softgtm-marketing__byo">Model · your key</p>
            </div>
            <div className="softgtm-marketing__avatar-card">
              <span className="softgtm-marketing__face-wrap">
                <MausAvatar
                  color="green"
                  state="working"
                  bodyId="blob"
                  size={112}
                  animated
                  lookAround={1}
                  spring={0.42}
                  trackPointer={false}
                />
              </span>
              <div>
                <p className="softgtm-marketing__avatar-name">{SOFT_GTM_AVATAR_NAME}</p>
                <p className="softgtm-marketing__avatar-role">{SOFT_GTM_AVATAR_ROLE}</p>
              </div>
            </div>
            <div className="softgtm-marketing__status-row" aria-live="polite">
              <span className="softgtm-marketing__status-dot" aria-hidden="true" />
              <span className="softgtm-marketing__status-text">{SOFT_GTM_STATUS_WORKING}</span>
            </div>
            <p className="softgtm-marketing__panel-line">{SOFT_GTM_DEMO_LINE}</p>
          </aside>
        </section>
      </main>
    </div>
  );
}
