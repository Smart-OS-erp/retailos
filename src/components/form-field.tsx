import type { InputHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  help?: string;
  label: string;
};

export function FormField({ help, id, label, ...inputProps }: FormFieldProps) {
  const fieldId = id ?? inputProps.name;
  const helpId = help && fieldId ? `${fieldId}-help` : undefined;

  return (
    <label className="field" htmlFor={fieldId}>
      <span className="field-label">{label}</span>
      <input
        {...inputProps}
        aria-describedby={helpId}
        id={fieldId}
      />
      {help ? (
        <span className="help" id={helpId}>
          {help}
        </span>
      ) : null}
    </label>
  );
}
