import type { ReactNode } from "react";
import { WatercolorSticker, type WatercolorMotif } from "../public/MarketDecorations";
import TextReveal from "../ui/TextReveal";

export function PageContainer({
  children,
  className = "",
  width = "standard",
}: {
  children: ReactNode;
  className?: string;
  width?: "standard" | "form" | "feed";
}) {
  return (
    <main
      className={`poppin-page ${width === "standard" ? "" : width === "feed" ? "poppin-feed" : "poppin-form-page"} ${className}`}
    >
      {children}
    </main>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  motif = "flower-bouquet",
  featured = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  motif?: WatercolorMotif;
  featured?: boolean;
}) {
  return (
    <header
      className={`poppin-page-heading ${featured ? "poppin-heading-featured" : ""}`}
    >
      <div className="poppin-heading-copy">
        <span className="poppin-eyebrow">
          <span className="eyebrow-dot" />
          {eyebrow}
        </span>
        <h1>
          <TextReveal key={title} text={title.endsWith(".") ? title.slice(0, -1) : title}
            suffix={!/[!?]$/.test(title) && <span className="heading-period">.</span>} />
        </h1>
        {description && <p>{description}</p>}
        {actions && <div className="poppin-actions">{actions}</div>}
      </div>
      <div className="poppin-heading-art" aria-hidden="true">
        <WatercolorSticker motif={motif} eager />
        <span>little local favorites</span>
      </div>
    </header>
  );
}
