import { isValidElement, useId, type ReactNode } from "react";
import FormField from "./FormField";
export default function FieldGroup({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  const suffix = useId();
  const id =
    "field-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-") + suffix;
  if (
    isValidElement<{
      id?: string;
      "aria-invalid"?: boolean;
      "aria-describedby"?: string;
    }>(children) &&
    (typeof children.type !== "string" ||
      ["input", "textarea", "select"].includes(children.type))
  )
    return (
      <FormField id={id} label={label} error={error}>
        {children}
      </FormField>
    );
  return (
    <fieldset className="poppin-field">
      <legend>{label}</legend>
      {children}
      {error && (
        <p role="alert" className="poppin-field-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
