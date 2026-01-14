/**
 * Create Tracking Link Dialog
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
import { useToast } from "@/hooks/use-toast";
import { useCreateTrackingLink } from "@/hooks/useCitationROI";
import { useSelectedBrand } from "@/stores";

const formSchema = z.object({
  originalUrl: z.string().url("Please enter a valid URL"),
  campaignName: z.string().optional(),
  targetPlatform: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateTrackingLinkDialogProps {
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

export function CreateTrackingLinkDialog({
  open,
  onOpenChange,
}: CreateTrackingLinkDialogProps) {
  const { toast } = useToast();
  const selectedBrand = useSelectedBrand();
  const createLink = useCreateTrackingLink();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originalUrl: "",
      campaignName: "",
      targetPlatform: "",
      utm_source: "",
      utm_medium: "citation",
      utm_campaign: "",
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
      await createLink.mutateAsync({
        brandId: selectedBrand.id,
        originalUrl: values.originalUrl,
        campaignName: values.campaignName || undefined,
        targetPlatform: values.targetPlatform || undefined,
        utmParams: {
          utm_source: values.utm_source || values.targetPlatform || "ai",
          utm_medium: values.utm_medium || "citation",
          utm_campaign: values.utm_campaign || values.campaignName || "apex_tracking",
        },
      });

      toast({
        title: "Link Created",
        description: "Your tracking link has been created successfully",
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create link",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Tracking Link</DialogTitle>
          <DialogDescription>
            Generate a UTM-tagged link to track conversions from AI citations
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="originalUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination URL *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/landing-page"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The URL you want to track conversions for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="campaignName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Q1 AI Visibility Campaign" {...field} />
                  </FormControl>
                  <FormDescription>
                    A name to identify this tracking link
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetPlatform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target AI Platform</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
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
                    The AI platform you expect traffic from
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium mb-3">UTM Parameters</p>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="utm_source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Source</FormLabel>
                      <FormControl>
                        <Input placeholder="ai" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="utm_medium"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Medium</FormLabel>
                      <FormControl>
                        <Input placeholder="citation" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="utm_campaign"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs">Campaign</FormLabel>
                      <FormControl>
                        <Input placeholder="apex_tracking" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLink.isPending}>
                {createLink.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Link
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
