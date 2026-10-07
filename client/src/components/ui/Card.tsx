import type { ComponentPropsWithoutRef } from "react";
export default function Card({
  className = "",
  variant = "standard",
  ...props
}: ComponentPropsWithoutRef<"article"> & {
  variant?: "standard" | "ticket" | "social" | "paper";
}) {
  return (
    <article
      {...props}
      className={`poppin-record-card poppin-card-${variant} ${className}`}
    />
  );
}
