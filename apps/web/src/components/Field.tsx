"use client";

// .f — always renders a real, associated <label> (FR-040, contracts/component-api.md).
import { useFormContext } from "react-hook-form";
import { useId } from "react";

export interface FieldProps {
  name: string;
  label: string;
  type?: string;
  as?: "input" | "select" | "textarea";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  wide?: boolean;
}

export function Field({ name, label, type = "text", as = "input", options, required, placeholder, wide }: FieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const id = useId();
  const error = errors[name];

  return (
    <div className={wide ? "f w" : "f"}>
      <label htmlFor={id}>{label}</label>
      {as === "select" ? (
        <select id={id} {...register(name)} required={required} aria-invalid={!!error}>
          {options?.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : as === "textarea" ? (
        <textarea id={id} rows={4} placeholder={placeholder} {...register(name)} required={required} aria-invalid={!!error} />
      ) : (
        <input id={id} type={type} placeholder={placeholder} {...register(name)} required={required} aria-invalid={!!error} />
      )}
      {error ? (
        <small className="error" role="alert">
          {String(error.message ?? "")}
        </small>
      ) : null}
    </div>
  );
}
