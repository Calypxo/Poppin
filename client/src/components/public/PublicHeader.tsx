import { useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowUpRight, Asterisk, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../../auth/context";
import { navigation } from "../shared/navigation";
import IconButton from "../ui/IconButton";
import PillNavigation from "./PillNavigation";

export default function PublicHeader() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath === pathname;
  const toggle = useRef<HTMLButtonElement>(null);
  const links = navigation(user);
  return (
    <header className="site-header">
      <a href="#public-content" className="poppin-skip">
        Skip to content
      </a>
      <div className="site-nav poppin-container">
        <Link
          to="/"
          aria-label="POPP'IN home"
          className="brand"
          onClick={() => setMenuPath(null)}
        >
          popp
          <span className="brand-mark">
            <Asterisk aria-hidden="true" />
          </span>
          in<span className="brand-dot">.</span>
        </Link>
        <PillNavigation links={links.filter(
          ({ to }) => !["/login", "/register", "/profile"].includes(to),
        )} />
        <div className="site-account">
          {user ? (
            <>
              <Link
                to="/profile"
                className="site-profile"
                aria-label="My profile"
              >
                <span>{user.name.slice(0, 1).toUpperCase()}</span>
                <span>My profile</span>
              </Link>
              <IconButton variant="ghost" aria-label="Log out" onClick={logout}>
                <LogOut size={18} />
              </IconButton>
            </>
          ) : (
            <>
              <Link to="/login" className="site-login">
                Log in
              </Link>
              <Link to="/register" className="site-join">
                Join the crowd <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </>
          )}
        </div>
        <IconButton
          ref={toggle}
          className="site-menu-toggle"
          variant="ghost"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="public-menu"
          onClick={() => setMenuPath(open ? null : pathname)}
        >
          {open ? <X size={23} /> : <Menu size={23} />}
        </IconButton>
      </div>
      {open && (
        <nav
          id="public-menu"
          className="mobile-nav"
          aria-label="Mobile navigation"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setMenuPath(null);
              toggle.current?.focus();
            }
          }}
        >
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setMenuPath(null)}
              className={({ isActive }) =>
                `site-nav-link ${isActive ? "is-active" : ""}`
              }
            >
              {label}
              <ArrowUpRight size={18} aria-hidden="true" />
            </NavLink>
          ))}
          {user && (
            <button
              className="site-nav-link"
              onClick={() => {
                logout();
                setMenuPath(null);
              }}
            >
              Log out <LogOut size={18} aria-hidden="true" />
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
