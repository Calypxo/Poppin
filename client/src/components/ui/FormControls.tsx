import type { ComponentPropsWithRef } from "react";
export function Input({
  className = "",
  ...props
}: ComponentPropsWithRef<"input">) {
  return <input {...props} className={`poppin-input ${className}`} />;
}
export function Textarea({
  className = "",
  ...props
}: ComponentPropsWithRef<"textarea">) {
  return (
    <textarea
      {...props}
      className={`poppin-input poppin-textarea ${className}`}
    />
  );
}
export function Select({
  className = "",
  ...props
}: ComponentPropsWithRef<"select">) {
  return <select {...props} className={`poppin-input ${className}`} />;
}
export function Checkbox({
  className = "",
  ...props
}: Omit<ComponentPropsWithRef<"input">, "type">) {
  return (
    <input
      {...props}
      type="checkbox"
      className={`poppin-checkbox ${className}`}
    />
  );
}
