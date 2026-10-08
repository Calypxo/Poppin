import type { ReactNode } from "react";
import type { WatercolorMotif } from "../public/MarketDecorations";
import { CalendarSearch } from "lucide-react";
import Button from "./Button";
export function Skeleton({
  className = "",
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      className={`poppin-ui-skeleton motion-safe:animate-pulse ${className}`}
    >
      {children}
    </div>
  );
}
export function LoadingState({
  label = "Gathering the latest local finds…",
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`poppin-loading-state ${compact ? "poppin-loading-compact" : ""}`}
      role="status"
      aria-live="polite"
    >
      <p className="poppin-eyebrow">{label}</p>
      <div aria-hidden="true" className="grid gap-3">
        {[1, 2].map((item) => (
          <div key={item} className="flex gap-4">
            <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-3 py-2">
              <Skeleton className="h-3 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export function EmptyState({
  title = "A little room for what’s next",
  description,
  action,
}: {
  title?: string;
  description?: string;
  motif?: WatercolorMotif;
  action?: ReactNode;
}) {
  return (
    <div className="poppin-empty-state">
      <span className="poppin-state-icon">
        <CalendarSearch size={30} aria-hidden="true" />
      </span>
      <div>
        <p className="poppin-empty-title">{title}</p>
        {description && <p>{description}</p>}
        {action && <div className="poppin-actions">{action}</div>}
      </div>
    </div>
  );
}
export function ErrorState({
  title = "Our noticeboard needs a little moment",
  description = "We couldn’t load this page. Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="poppin-error-state" role="alert">
      <p className="poppin-empty-title">{title}</p>
      <p>{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
