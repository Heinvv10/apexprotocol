"use client";

import * as React from "react";
import {
  useFormContext,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { cn } from "@/lib/utils";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "number" | "url" | "tel" | "textarea";
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  autoComplete?: string;
  icon?: React.ReactNode;
  rows?: number;
}

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  description,
  placeholder,
  type = "text",
  disabled,
  className,
  inputClassName,
  required,
  autoComplete,
  icon,
  rows = 4,
}: FormFieldProps<TFieldValues, TName>) {
  const {
    control,
    formState: { errors },
  } = useFormContext<TFieldValues>();

  const [showPassword, setShowPassword] = React.useState(false);
  const error = errors[name];
  const errorMessage = error?.message as string | undefined;

  const isPasswordType = type === "password";
  const inputType = isPasswordType && showPassword ? "text" : type;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className={cn("space-y-2", className)}>
          {label && (
            <label
              htmlFor={name}
              className="text-sm font-medium text-foreground flex items-center gap-1"
            >
              {label}
              {required && <span className="text-error">*</span>}
            </label>
          )}

          <div className="relative">
            {icon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {icon}
              </div>
            )}

            {type === "textarea" ? (
              <textarea
                {...field}
                id={name}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                aria-invalid={!!error}
                aria-describedby={errorMessage ? `${name}-error` : description ? `${name}-description` : undefined}
                className={cn(
                  "w-full rounded-lg px-4 py-3",
                  "bg-muted/50 border text-foreground placeholder:text-muted-foreground",
                  "focus-ring-input",
                  "resize-none",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  error ? "border-error" : "border-border",
                  icon && "pl-10",
                  inputClassName
                )}
              />
            ) : (
              <input
                {...field}
                id={name}
                type={inputType}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete={autoComplete}
                aria-invalid={!!error}
                aria-describedby={errorMessage ? `${name}-error` : description ? `${name}-description` : undefined}
                className={cn(
                  "w-full h-11 rounded-lg px-4",
                  "bg-muted/50 border text-foreground placeholder:text-muted-foreground",
                  "focus-ring-input",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  error ? "border-error" : "border-border",
                  icon && "pl-10",
                  isPasswordType && "pr-11",
                  inputClassName
                )}
              />
            )}

            {isPasswordType && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-ring-primary rounded"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {description && !errorMessage && (
            <p id={`${name}-description`} className="text-xs text-muted-foreground">{description}</p>
          )}

          {errorMessage && (
            <p id={`${name}-error`} className="text-xs text-error flex items-center gap-1" role="alert">
              <AlertCircle className="w-3 h-3" />
              {errorMessage}
            </p>
          )}
        </div>
      )}
    />
  );
}
