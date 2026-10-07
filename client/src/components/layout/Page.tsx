import type { ReactNode } from "react";
import {
  WatercolorSticker,
  type WatercolorMotif,
} from "../public/MarketDecorations";
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
  motif,
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
      className={`poppin-page-heading poppin-editorial-heading ${motif ? "poppin-heading-with-art" : ""} ${featured ? "poppin-heading-featured" : ""}`}
    >
      <div className="poppin-heading-copy">
        <span className="poppin-eyebrow">{eyebrow}</span>
        <h1>
          <span>{title}</span>
        </h1>
        {description && <p>{description}</p>}
        {actions && <div className="poppin-actions">{actions}</div>}
      </div>
      {motif && (
        <WatercolorSticker motif={motif} className="poppin-heading-art" />
      )}
    </header>
  );
}
