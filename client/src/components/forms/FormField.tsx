import { cloneElement, type ReactElement } from "react";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactElement<{
    id?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }>;
}

export default function FormField({
  id,
  label,
  error,
  required,
  hint,
  children,
}: FieldProps) {
  return (
    <div className="poppin-field">
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {cloneElement(children, {
        id,
        "aria-invalid": !!error,
        "aria-describedby":
          [
            hint && `${id}-hint`,
            error && `${id}-error`,
            children.props["aria-describedby"],
          ]
            .filter(Boolean)
            .join(" ") || undefined,
      })}
      {hint && (
        <p id={`${id}-hint`} className="poppin-field-help">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="poppin-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
