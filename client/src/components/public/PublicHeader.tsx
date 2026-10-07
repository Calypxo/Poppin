import { useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Asterisk, Menu, X } from "lucide-react";

import { useAuth } from "../../auth/context";
import { navigation } from "../shared/navigation";
import IconButton from "../ui/IconButton";
export default function PublicHeader() {
  const { user, logout } = useAuth();
  const links = navigation(user);
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  return (
    <header className="relative z-20 border-b border-ink/15 bg-paper">
      <a href="#public-content" className="poppin-skip">
        Skip to content
      </a>
      <div className="poppin-top-strip bg-olive px-4 py-2.5 text-center text-[10px] font-semibold tracking-[0.1em] text-paper sm:text-[11px] sm:tracking-[0.2em]">
        <span>POP-UPS · BAZAARS · LOCAL FINDS · PAMPANGA</span>
      </div>
      <div className="poppin-container grid min-h-24 grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <Link
          to="/discover"
          className="hidden w-fit font-body text-xl italic text-ink lg:block"
        >
          What’s near you?
        </Link>
        <Link
          to="/"
          aria-label="POPP’IN home"
          className="poppin-wordmark w-fit text-[38px] text-olive sm:text-[44px]"
          onClick={() => setOpen(false)}
        >
          POPP’IN
          <Asterisk
            size={15}
            aria-hidden="true"
            className="ml-1 mt-2 inline-block align-top"
          />
        </Link>
        <nav
          aria-label="Main navigation"
          className="hidden justify-end flex-wrap gap-3 lg:flex"
        >
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `poppin-nav-link ${isActive && !to.includes("#") ? "is-active" : ""}`
              }
            >
              {label}
            </NavLink>
          ))}
          {user && (
            <button type="button" className="poppin-nav-link" onClick={logout}>
              Log out
            </button>
          )}
        </nav>
        <IconButton
          ref={toggle}
          type="button"
          className="poppin-menu-toggle justify-self-end rounded-xl border border-olive/40 bg-sage/40 p-3 text-ink lg:hidden"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="public-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <X size={22} aria-hidden="true" />
          ) : (
            <Menu size={22} aria-hidden="true" />
          )}
        </IconButton>
      </div>
      {open && (
        <nav
          id="public-menu"
          aria-label="Mobile public navigation"
          className="poppin-container flex flex-col gap-1 border-t border-ink/10 py-4 lg:hidden"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              toggle.current?.focus();
            }
          }}
        >
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="poppin-nav-link py-3"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          {user && (
            <button
              type="button"
              className="poppin-nav-link py-3 text-left"
              onClick={() => {
                logout();
                setOpen(false);
              }}
            >
              Log out
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
