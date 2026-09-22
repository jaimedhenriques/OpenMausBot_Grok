import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { SoftGtmMarketingHero } from "@/components/softgtm/SoftGtmMarketingHero";
import { bootstrapBrand } from "@/lib/brand";
import { applySkin, readSkin } from "@/lib/skins";
import "../styles.css";

/** Dev-only Soft GTM marketing fold — `/softgtm-marketing-preview.html`. */
function Preview() {
  useEffect(() => {
    if (new URLSearchParams(location.search).get("reduced") === "1") {
      document.documentElement.dataset.reducedMotion = "true";
    }
  }, []);

  return (
    <SoftGtmMarketingHero installHref="#install" hostedJoinHref="#hosted-join" />
  );
}

applySkin(readSkin());

void bootstrapBrand().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Preview />
    </StrictMode>,
  );
});
