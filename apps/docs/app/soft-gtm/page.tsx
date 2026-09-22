import Link from "next/link";
import {
  SOFT_GTM_502,
  SOFT_GTM_CREAM,
  SOFT_GTM_HERO_LEDE,
  SOFT_GTM_HERO_TITLE,
  SOFT_GTM_HOLD,
  SOFT_GTM_PRICING,
  SOFT_GTM_REVENUE,
} from "../../lib/softgtm-copy";
import styles from "./soft-gtm.module.css";

export const metadata = {
  title: "Soft GTM preview",
  description: "Customer-facing Soft GTM draft for OpenMausBot. No send.",
  robots: { index: false, follow: false },
};

export default function SoftGtmPage() {
  return (
    <div className={styles.page} style={{ ["--softgtm-cream" as string]: SOFT_GTM_CREAM }}>
      <header className={styles.header}>
        <Link href="/docs" className={styles.back}>
          Documentation
        </Link>
        <p className={styles.hold}>{SOFT_GTM_HOLD}</p>
      </header>
      <main className={styles.main}>
        <section aria-labelledby="softgtm-title">
          <h1 id="softgtm-title">{SOFT_GTM_HERO_TITLE}</h1>
          <p className={styles.lede}>{SOFT_GTM_HERO_LEDE}</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/docs/getting-started/installation">
              Install OpenMausBot
            </Link>
            <a className={styles.secondary} href="https://app.squadbots.ai/join" rel="noopener noreferrer">
              Hosted signup path
            </a>
          </div>
          <p className={styles.meta}>{SOFT_GTM_PRICING}</p>
          <p className={styles.meta}>{SOFT_GTM_REVENUE}</p>
          <p className={styles.meta}>{SOFT_GTM_502}</p>
        </section>
        <aside className={styles.stage} aria-label="Quiet onboarding preview">
          <p className={styles.sim}>Simulated workspace · model key is yours</p>
          <p className={styles.status}>
            <span className={styles.dot} aria-hidden="true" />
            Working
          </p>
          <p className={styles.panel}>Checking the failing test before proposing a fix.</p>
        </aside>
      </main>
    </div>
  );
}
