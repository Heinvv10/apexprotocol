"use client";

import * as React from "react";
import {
  useFormContext,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { cn } from "@/lib/utils";
import { AlertCircle, ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  options: Option[];
  disabled?: boolean;
  className?: string;
  selectClassName?: string;
  required?: boolean;
}

export function FormSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  description,
  placeholder = "Select an option",
  options,
  disabled,
  className,
  selectClassName,
  required,
}: FormSelectProps<TFieldValues, TName>) {
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
            <select
              {...field}
              id={name}
              disabled={disabled}
              className={cn(
                "w-full h-11 rounded-lg px-4 pr-10 appearance-none",
                "bg-muted/50 border text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "transition-all duration-150",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                error ? "border-error" : "border-border",
                !field.value && "text-muted-foreground",
                selectClassName
              )}
            >
              <option value="" disabled>
                {placeholder}
              </option>
              {options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>

            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {description && !errorMessage && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}

          {errorMessage && (
            <p className="text-xs text-error flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errorMessage}
            </p>
          )}
        </div>
      )}
    />
  );
}
