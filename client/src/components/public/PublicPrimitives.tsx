import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Asterisk, Pause, Play } from "lucide-react";
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
      variant={light ? "secondary" : "primary"}
      icon={<ArrowUpRight size={18} aria-hidden="true" />}
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
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("poppin-revealed");
          observer.disconnect();
        }
      },
      { threshold: 0.04 },
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
    <div className="section-heading">
      <p className="poppin-eyebrow">{eyebrow}</p>
      <h2 className="poppin-heading">{children}</h2>
      {copy && <p className="section-description">{copy}</p>}
    </div>
  );
}
export function DecorativeMarquee() {
  const [paused, setPaused] = useState(false);
  const words = ["GOOD FINDS", "GREAT PEOPLE", "LOCAL ENERGY", "GO POPP'IN"];
  return (
    <div className={`modern-marquee ${paused ? "is-paused" : ""}`}>
      <div className="modern-marquee-viewport" aria-hidden="true">
        <div className="modern-marquee-track">
          {["one", "two"].map((copy) => (
            <div key={copy}>
              {words.map((word) => (
                <span key={word}>
                  {word}
                  <Asterisk size={24} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="marquee-control"
        onClick={() => setPaused(!paused)}
        aria-label={paused ? "Play moving banner" : "Pause moving banner"}
        aria-pressed={paused}
      >
        {paused ? (
          <Play size={14} aria-hidden="true" />
        ) : (
          <Pause size={14} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
