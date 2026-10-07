import type { ComponentPropsWithRef, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { LoaderCircle } from "lucide-react";

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "danger";
interface Appearance {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  icon?: ReactNode;
}
function buttonClass(
  { variant = "primary", size = "md", fullWidth }: Appearance,
  extra = "",
) {
  return `poppin-ui-button poppin-ui-button-${variant} poppin-ui-button-${size} inline-flex items-center justify-center gap-2 ${fullWidth ? "w-full" : ""} ${extra}`;
}
export default function Button({
  variant,
  size,
  fullWidth,
  icon,
  loading = false,
  disabled,
  children,
  className,
  type = "button",
  ...props
}: Appearance & ComponentPropsWithRef<"button"> & { loading?: boolean }) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, fullWidth }, className)}
    >
      {loading ? (
        <LoaderCircle
          size={17}
          aria-hidden="true"
          className="motion-safe:animate-spin"
        />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
export function ButtonLink({
  variant,
  size,
  fullWidth,
  icon,
  children,
  className,
  ...props
}: Appearance & LinkProps) {
  return (
    <Link
      {...props}
      className={buttonClass({ variant, size, fullWidth }, className)}
    >
      {children}
      {icon}
    </Link>
  );
}
