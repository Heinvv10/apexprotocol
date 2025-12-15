"use client";

import * as React from "react";
import {
  useFormContext,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { cn } from "@/lib/utils";
import { AlertCircle, Check } from "lucide-react";

interface FormCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  label: React.ReactNode;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function FormCheckbox<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  description,
  disabled,
  className,
}: FormCheckboxProps<TFieldValues, TName>) {
  const {
    control,
    formState: { errors },
  } = useFormContext<TFieldValues>();

  const error = errors[name];
  const errorMessage = error?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className={cn("space-y-2", className)}>
          <label
            className={cn(
              "flex items-start gap-3 cursor-pointer group",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={disabled}
                className="sr-only peer"
              />
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 transition-all duration-150",
                  "flex items-center justify-center",
                  field.value
                    ? "bg-primary border-primary"
                    : "bg-muted/50 border-border group-hover:border-primary/50",
                  error && "border-error"
                )}
              >
                {field.value && (
                  <Check className="w-3 h-3 text-primary-foreground" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-sm text-foreground">{label}</span>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </label>

          {errorMessage && (
            <p className="text-xs text-error flex items-center gap-1 ml-8">
              <AlertCircle className="w-3 h-3" />
              {errorMessage}
            </p>
          )}
        </div>
      )}
    />
  );
}

// Multi-checkbox group
interface FormCheckboxGroupProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  label?: string;
  description?: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  disabled?: boolean;
  className?: string;
  columns?: 1 | 2 | 3;
  required?: boolean;
}

export function FormCheckboxGroup<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  description,
  options,
  disabled,
  className,
  columns = 1,
  required,
}: FormCheckboxGroupProps<TFieldValues, TName>) {
  const {
    control,
    formState: { errors },
  } = useFormContext<TFieldValues>();

  const error = errors[name];
  const errorMessage = error?.message as string | undefined;

  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const values = (field.value as string[]) || [];

        const handleChange = (optionValue: string, checked: boolean) => {
          if (checked) {
            field.onChange([...values, optionValue]);
          } else {
            field.onChange(values.filter((v) => v !== optionValue));
          }
        };

        return (
          <div className={cn("space-y-3", className)}>
            {label && (
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                {label}
                {required && <span className="text-error">*</span>}
              </label>
            )}

            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}

            <div className={cn("grid gap-3", gridCols[columns])}>
              {options.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-start gap-3 cursor-pointer group p-3 rounded-lg",
                    "bg-muted/30 border border-transparent",
                    "hover:border-primary/30 transition-all duration-150",
                    values.includes(option.value) && "border-primary/50 bg-primary/5",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={values.includes(option.value)}
                      onChange={(e) => handleChange(option.value, e.target.checked)}
                      disabled={disabled}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        "w-5 h-5 rounded border-2 transition-all duration-150",
                        "flex items-center justify-center",
                        values.includes(option.value)
                          ? "bg-primary border-primary"
                          : "bg-muted/50 border-border group-hover:border-primary/50"
                      )}
                    >
                      {values.includes(option.value) && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">
                      {option.label}
                    </span>
                    {option.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {option.description}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {errorMessage && (
              <p className="text-xs text-error flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errorMessage}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
