import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Ellipsis } from "lucide-react";
import IconButton from "./IconButton";
interface MenuItem {
  label: string;
  to?: string;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
}
export default function DropdownMenu({
  label = "More actions",
  items,
}: {
  label?: string;
  items: MenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    ref.current
      ?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')
      ?.focus();
    const outside = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return (
    <div ref={ref} className="poppin-dropdown relative">
      <IconButton
        ref={trigger}
        aria-label={label}
        aria-haspopup="menu"
        aria-controls={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <Ellipsis size={20} aria-hidden="true" />
      </IconButton>
      {open && (
        <div
          id={id}
          role="menu"
          aria-label={label}
          className="poppin-dropdown-menu"
          onKeyDown={(event) => {
            const entries = [
              ...event.currentTarget.querySelectorAll<HTMLElement>(
                '[role="menuitem"]:not(:disabled)',
              ),
            ];
            const index = entries.indexOf(
              document.activeElement as HTMLElement,
            );
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              trigger.current?.focus();
            } else if (event.key === "Tab") setOpen(false);
            else {
              const next =
                event.key === "ArrowDown"
                  ? (index + 1) % entries.length
                  : event.key === "ArrowUp"
                    ? (index - 1 + entries.length) % entries.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? entries.length - 1
                        : -1;
              if (next >= 0) {
                event.preventDefault();
                entries[next]?.focus();
              }
            }
          }}
        >
          {items.map((item) =>
            item.to ? (
              <Link
                role="menuitem"
                tabIndex={-1}
                key={item.label}
                to={item.to}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <button
                role="menuitem"
                tabIndex={-1}
                type="button"
                className={item.danger ? "poppin-menu-danger" : ""}
                key={item.label}
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  trigger.current?.focus();
                  item.onSelect?.();
                }}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
