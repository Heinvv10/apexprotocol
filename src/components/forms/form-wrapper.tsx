"use client";

import * as React from "react";
import {
  useForm,
  FormProvider,
  type UseFormReturn,
  type FieldValues,
  type SubmitHandler,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface FormWrapperProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodSchema<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValues?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: SubmitHandler<any>;
  children: React.ReactNode;
  className?: string;
  submitText?: string;
  submitClassName?: string;
  showSubmit?: boolean;
  isSubmitting?: boolean;
  footer?: React.ReactNode;
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
}

export function FormWrapper({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  submitText = "Submit",
  submitClassName,
  showSubmit = true,
  isSubmitting: externalIsSubmitting,
  footer,
  mode = "onBlur",
}: FormWrapperProps) {
  const methods = useForm({
    // Cast to fix Zod 4 compatibility issue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as Resolver<any>,
    defaultValues,
    mode,
  });

  const {
    handleSubmit,
    formState: { isSubmitting: formIsSubmitting },
  } = methods;

  const isSubmitting = externalIsSubmitting ?? formIsSubmitting;

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn("space-y-5", className)}
      >
        {children}

        {showSubmit && (
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full h-11 rounded-lg font-medium",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 active:bg-primary/80",
              "focus-ring-offset",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2",
              submitClassName
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              submitText
            )}
          </button>
        )}

        {footer}
      </form>
    </FormProvider>
  );
}

// Export zodResolver for direct usage with type casting
export { zodResolver };
