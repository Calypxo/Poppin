import { useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowUpRight, ChevronDown, LogOut, Menu, Plus, X } from "lucide-react";
import { useAuth } from "../../auth/context";
import { accountNavigation, primaryNavigation } from "../shared/navigation";
import { useUI } from "../ui/context";
import IconButton from "../ui/IconButton";
import { ButtonLink } from "../ui/Button";
import DropdownMenu from "../ui/DropdownMenu";
import PillNavigation from "./PillNavigation";
import BrandLogo from "../shared/BrandLogo";

export default function PublicHeader() {
  const { user, logout } = useAuth();
  const { confirm } = useUI();
  const { pathname } = useLocation();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath === pathname;
  const toggle = useRef<HTMLButtonElement>(null);
  const accountLinks = accountNavigation(user);
  const accountActive = accountLinks.some(({ to }) => pathname === to || pathname.startsWith(to + "/"));
  async function requestLogout() {
    if (!(await confirm({
      title: "Log out?",
      description: "You’ll need to log in again to access your account and saved events.",
      confirmLabel: "Log out",
      cancelLabel: "Stay logged in",
      variant: "primary",
    }))) return;
    logout();
    setMenuPath(null);
  }
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
          <BrandLogo />
        </Link>
        <PillNavigation links={primaryNavigation} />
        <div className="site-account">
          {user ? (
            <>
              {user.organizerId && (
                <ButtonLink to="/events/new" size="sm" className="site-create-event">
                  <Plus size={16} aria-hidden="true" /> Create event
                </ButtonLink>
              )}
              <DropdownMenu
                label="Account menu"
                className="site-account-dropdown"
                triggerClassName={`site-account-trigger ${accountActive ? "is-current" : ""}`}
                triggerContent={<>
                  <span className="site-account-avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
                  <span>Account</span>
                  <ChevronDown size={15} aria-hidden="true" />
                </>}
                items={[
                  ...accountLinks.filter(({ to }) => to !== "/events/new"),
                  { label: "Log out", onSelect: () => void requestLogout() },
                ]}
              />
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
          {[
            { label: "Explore", links: primaryNavigation },
            { label: user ? "Your account" : "Join Popp’in", links: accountLinks },
          ].map(group => (
            <div className="mobile-nav-group" key={group.label}>
              <p className="mobile-nav-label">{group.label}</p>
              {group.links.map(({ to, label }) => (
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
            </div>
          ))}
          {user && (
            <button
              type="button"
              className="site-nav-link site-mobile-logout"
              onClick={() => void requestLogout()}
            >
              Log out <LogOut size={18} aria-hidden="true" />
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
