import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { WatercolorSticker } from "./MarketDecorations";
import { ButtonLink } from "../ui/Button";

export function ActionLink({
  to,
  children,
  light = false,
  text = false,
}: {
  to: string;
  children: ReactNode;
  light?: boolean;
  text?: boolean;
}) {
  return text ? (
    <Link to={to} className="poppin-text-link">
      {children}
      <ArrowUpRight size={17} aria-hidden="true" />
    </Link>
  ) : (
    <ButtonLink
      to={to}
      size="lg"
      variant={light ? "outline" : "primary"}
      className={`poppin-button ${light ? "poppin-button-light" : ""}`}
      icon={<ArrowUpRight size={17} aria-hidden="true" />}
    >
      {children}
    </ButtonLink>
  );
}

export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (
      !element ||
      !window.IntersectionObserver ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    // Content is visible by default, including without animation support.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("poppin-revealed");
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    element.classList.add("poppin-reveal-ready");
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`poppin-reveal ${className}`}>
      {children}
    </div>
  );
}

export function FlowerSticker({ className = "" }: { className?: string }) {
  return <WatercolorSticker motif="flower-bouquet" className={className} />;
}

export function SectionHeading({
  eyebrow,
  children,
  copy,
}: {
  eyebrow: string;
  children: ReactNode;
  copy?: string;
}) {
  return (
    <Reveal>
      <p className="poppin-eyebrow mb-4">{eyebrow}</p>
      <h2 className="poppin-heading">{children}</h2>
      {copy && (
        <p className="mt-4 max-w-lg text-sm leading-7 text-ink/75 sm:text-base">
          {copy}
        </p>
      )}
    </Reveal>
  );
}

export function DecorativeMarquee() {
  const content =
    "WHAT’S POPP’IN?  ✳  WHAT’S NEAR YOU?  ✳  PAMPANGA  ✳  LOCAL FINDS  ✳  ";
  return (
    <div
      className="overflow-hidden border-y border-pink bg-pink/60 py-4 text-ink"
      aria-hidden="true"
    >
      <div className="poppin-marquee flex w-max font-body text-xl italic sm:text-2xl">
        <span className="whitespace-pre">{content.repeat(2)}</span>
        <span className="whitespace-pre">{content.repeat(2)}</span>
      </div>
    </div>
  );
}
