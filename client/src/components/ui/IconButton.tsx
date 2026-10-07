import Button, { type ButtonVariant } from "./Button";
import type { ComponentPropsWithRef } from "react";
export default function IconButton({
  size = "md",
  variant = "ghost",
  className = "",
  ...props
}: ComponentPropsWithRef<"button"> & {
  "aria-label": string;
  size?: "sm" | "md" | "lg";
  variant?: ButtonVariant;
}) {
  return (
    <Button
      {...props}
      size={size}
      variant={variant}
      className={`poppin-icon-button shrink-0 ${className}`}
    />
  );
}
