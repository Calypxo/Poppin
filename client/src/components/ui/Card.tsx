import type { ComponentPropsWithoutRef } from "react";
import useSurfaceMotion from "../../hooks/useSurfaceMotion";
export default function Card({
  className = "",
  variant = "standard",
  onPointerMove,
  onPointerLeave,
  onPointerCancel,
  ...props
}: ComponentPropsWithoutRef<"article"> & {
  variant?: "standard" | "ticket" | "social" | "paper";
}) {
  const motion = useSurfaceMotion<HTMLElement>();
  return (
    <article
      {...props}
      onPointerMove={(event) => { onPointerMove?.(event); motion.onPointerMove(event); }}
      onPointerLeave={(event) => { onPointerLeave?.(event); motion.onPointerLeave(); }}
      onPointerCancel={(event) => { onPointerCancel?.(event); motion.onPointerCancel(); }}
      className={`poppin-record-card poppin-card-${variant} interactive-surface ${className}`}
    />
  );
}
