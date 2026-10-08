import { useEffect, useRef, type PointerEvent } from "react";

// A lightweight POPP'IN interaction inspired by React Bits' Spotlight/Tilted Card.
// Pointer updates stay outside React renders; touch and reduced motion stay still.
export default function useSurfaceMotion<T extends HTMLElement>(tilt = 0) {
  const enabled = useRef(false);
  const frame = useRef<number | null>(null);
  const surface = useRef<T | null>(null);

  function reset() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    if (surface.current) {
      delete surface.current.dataset.pointerActive;
      surface.current.style.setProperty("--surface-rx", "0deg");
      surface.current.style.setProperty("--surface-ry", "0deg");
    }
  }

  useEffect(() => {
    const media = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    const update = () => {
      enabled.current = media.matches;
      if (!media.matches) reset();
    };
    update();
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
      reset();
    };
  }, []);

  function onPointerMove(event: PointerEvent<T>) {
    if (!enabled.current || event.pointerType !== "mouse") return;
    const element = event.currentTarget;
    surface.current = element;
    const { clientX, clientY } = event;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      if (!element.isConnected) return;
      const rect = element.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
      element.style.setProperty("--surface-x", `${x}px`);
      element.style.setProperty("--surface-y", `${y}px`);
      if (tilt && rect.width && rect.height) {
        element.style.setProperty("--surface-rx", `${(0.5 - y / rect.height) * tilt}deg`);
        element.style.setProperty("--surface-ry", `${(x / rect.width - 0.5) * tilt}deg`);
      }
      element.dataset.pointerActive = "true";
    });
  }

  return { onPointerMove, onPointerLeave: reset, onPointerCancel: reset };
}
