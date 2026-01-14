"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Bot, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentBriefBuilder } from "@/components/create/content-brief-builder";
import { useSelectedBrand } from "@/stores";

// Prompt to select a brand
function SelectBrandPrompt() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-lg space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 204, 0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          <div className="relative w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Bot className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Select a Brand to Generate Briefs</h2>
          <p className="text-muted-foreground">
            Choose a brand from the dropdown in the header to generate AI-optimized content briefs using your brand voice and data.
          </p>
        </div>
        <Link href="/dashboard/brands">
          <Button variant="outline" size="lg" className="gap-2">
            Manage Brands
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function BriefPage() {
  const selectedBrand = useSelectedBrand();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/create">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Content Brief Generator</h2>
            <p className="text-muted-foreground">
              Generate AI-optimized content briefs for your brand
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {!selectedBrand ? (
        <SelectBrandPrompt />
      ) : (
        <ContentBriefBuilder />
      )}
    </div>
  );
}
