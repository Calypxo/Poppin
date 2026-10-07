import type { ReactNode } from "react";
import { Check, CircleAlert, Info, X } from "lucide-react";
import IconButton from "./IconButton";
export type AlertVariant = "success" | "error" | "warning" | "info";
export default function Alert({
  variant = "info",
  title,
  children,
  onDismiss,
  announce = true,
  className = "",
}: {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  announce?: boolean;
  className?: string;
}) {
  const Icon =
    variant === "success"
      ? Check
      : variant === "error" || variant === "warning"
        ? CircleAlert
        : Info;
  return (
    <div
      className={`poppin-alert poppin-alert-${variant} flex items-start gap-3 ${className}`}
      role={
        announce
          ? variant === "error" || variant === "warning"
            ? "alert"
            : "status"
          : undefined
      }
    >
      <span className="poppin-alert-icon shrink-0" aria-hidden="true">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        {title && <strong className="block">{title}</strong>}
        <div>{children}</div>
      </div>
      {onDismiss && (
        <IconButton size="sm" aria-label="Dismiss message" onClick={onDismiss}>
          <X size={16} aria-hidden="true" />
        </IconButton>
      )}
    </div>
  );
}
