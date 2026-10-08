import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function PillNavigation({ links }: {
  links: { to: string; label: string }[];
}) {
  const nav = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const paths = links.map(({ to }) => to).join("|");

  useEffect(() => {
    const element = nav.current;
    if (!element) return;
    let alive = true;
    const align = () => {
      if (!alive) return;
      const active = element.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active || !active.offsetWidth) {
        delete element.dataset.activePill;
        return;
      }
      element.style.setProperty("--nav-left", `${active.offsetLeft}px`);
      element.style.setProperty("--nav-top", `${active.offsetTop}px`);
      element.style.setProperty("--nav-width", `${active.offsetWidth}px`);
      element.style.setProperty("--nav-height", `${active.offsetHeight}px`);
      element.dataset.activePill = "true";
    };
    align();
    const observer = new ResizeObserver(align);
    observer.observe(element);
    void document.fonts.ready.then(align);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [pathname, paths]);

  return (
    <nav ref={nav} className="desktop-nav pill-navigation" aria-label="Main navigation">
      <span className="nav-active-pill" aria-hidden="true" />
      {links.map(({ to, label }) => (
        <NavLink key={to} to={to} end={to === "/"}
          className={({ isActive }) => `site-nav-link ${isActive ? "is-active" : ""}`}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
