/**
 * Record Conversion Dialog
 * Phase 15: AI Citation ROI Calculator
 */

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useCreateConversion } from "@/hooks/useCitationROI";
import { useSelectedBrand } from "@/stores";

const formSchema = z.object({
  sourcePlatform: z.string().min(1, "Please select a platform"),
  conversionType: z.enum([
    "signup",
    "purchase",
    "contact",
    "download",
    "demo_request",
    "newsletter",
    "free_trial",
    "custom",
  ]),
  conversionValue: z.number().min(0, "Value must be positive"),
  landingPage: z.string().url().optional().or(z.literal("")),
  attributionConfidence: z.number().min(0).max(1),
});

type FormValues = z.infer<typeof formSchema>;

interface RecordConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AI_PLATFORMS = [
  { value: "chatgpt", label: "ChatGPT" },
  { value: "claude", label: "Claude" },
  { value: "gemini", label: "Gemini" },
  { value: "perplexity", label: "Perplexity" },
  { value: "grok", label: "Grok" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "copilot", label: "Copilot" },
];

const CONVERSION_TYPES = [
  { value: "signup", label: "Sign Up" },
  { value: "purchase", label: "Purchase" },
  { value: "contact", label: "Contact Form" },
  { value: "download", label: "Download" },
  { value: "demo_request", label: "Demo Request" },
  { value: "newsletter", label: "Newsletter" },
  { value: "free_trial", label: "Free Trial" },
  { value: "custom", label: "Custom" },
];

export function RecordConversionDialog({
  open,
  onOpenChange,
}: RecordConversionDialogProps) {
  const { toast } = useToast();
  const selectedBrand = useSelectedBrand();
  const createConversion = useCreateConversion();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourcePlatform: "",
      conversionType: "signup",
      conversionValue: 0,
      landingPage: "",
      attributionConfidence: 0.5,
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!selectedBrand?.id) {
      toast({
        title: "Error",
        description: "No brand selected",
        variant: "destructive",
      });
      return;
    }

    try {
      await createConversion.mutateAsync({
        brandId: selectedBrand.id,
        sourcePlatform: values.sourcePlatform,
        conversionType: values.conversionType,
        conversionValue: values.conversionValue,
        landingPage: values.landingPage || undefined,
        attributionConfidence: values.attributionConfidence,
      });

      toast({
        title: "Conversion Recorded",
        description: "The conversion has been recorded successfully",
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to record conversion",
        variant: "destructive",
      });
    }
  };

  const confidenceValue = form.watch("attributionConfidence");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Conversion</DialogTitle>
          <DialogDescription>
            Manually record a conversion attributed to an AI citation
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sourcePlatform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Platform *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AI_PLATFORMS.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The AI platform the visitor came from
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conversionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conversion Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONVERSION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    What action did the visitor take
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conversionValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conversion Value (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    The monetary value of this conversion
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="landingPage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Landing Page URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/landing"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The page where the conversion occurred
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attributionConfidence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Attribution Confidence: {Math.round(confidenceValue * 100)}%
                  </FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value)}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    How confident are you that this conversion came from an AI
                    citation?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createConversion.isPending}>
                {createConversion.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Record Conversion
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
