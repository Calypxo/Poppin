import { useId, type ReactNode } from "react";
export default function Tabs({
  items,
  value,
  onChange,
  children,
  label = "Sections",
}: {
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  label?: string;
}) {
  const id = useId();
  return (
    <div className="poppin-tabs">
      <div
        role="tablist"
        aria-label={label}
        className="poppin-tablist flex gap-2"
        onKeyDown={(event) => {
          const index = items.findIndex((item) => item.value === value);
          const next =
            event.key === "ArrowRight"
              ? (index + 1) % items.length
              : event.key === "ArrowLeft"
                ? (index - 1 + items.length) % items.length
                : event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? items.length - 1
                    : -1;
          if (next < 0) return;
          event.preventDefault();
          onChange(items[next].value);
          document.getElementById(`${id}-${items[next].value}-tab`)?.focus();
        }}
      >
        {items.map((item) => (
          <button
            type="button"
            key={item.value}
            role="tab"
            id={`${id}-${item.value}-tab`}
            aria-selected={item.value === value}
            aria-controls={`${id}-${item.value}-panel`}
            tabIndex={item.value === value ? 0 : -1}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.value}
          role="tabpanel"
          id={`${id}-${item.value}-panel`}
          aria-labelledby={`${id}-${item.value}-tab`}
          hidden={item.value !== value}
          tabIndex={0}
        >
          {item.value === value ? children : null}
        </div>
      ))}
    </div>
  );
}
