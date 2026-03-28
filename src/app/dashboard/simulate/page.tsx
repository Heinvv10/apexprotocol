"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { FlaskConical, ArrowRight, Bot } from "lucide-react";
import Link from "next/link";

import { useSelectedBrand } from "@/stores";
import { useSimulationStore } from "@/stores/simulation-store";
import { SimulationSetupForm } from "@/components/simulate/simulation-setup-form";
import { SimulationProgress } from "@/components/simulate/simulation-progress";
import { SimulationResults } from "@/components/simulate/simulation-results";
import { SimulationHistory } from "@/components/simulate/simulation-history";

function PageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4L28 28H4L16 4Z" fill="url(#apexGradSim)" />
            <defs>
              <linearGradient id="apexGradSim" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00E5CC"/>
                <stop offset="1" stopColor="#8B5CF6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          APEX
        </span>
        <span className="text-xl font-light text-foreground ml-1">Simulate</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">AI Status:</span>
        <span className="text-xs text-primary font-medium">Active</span>
      </div>
    </div>
  );
}

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
          <h2 className="text-xl font-semibold text-foreground">Select a Brand to Simulate</h2>
          <p className="text-muted-foreground">
            Choose a brand from the dropdown in the header to test how content impacts your AI visibility.
          </p>
        </div>
        <Link
          href="/dashboard/brands"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/30 font-medium hover:bg-primary/20 transition-all"
        >
          Manage Brands
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function SimulatePageInner() {
  const selectedBrand = useSelectedBrand();
  const searchParams = useSearchParams();
  const contentId = searchParams.get("contentId");

  const {
    currentStep,
    setStep,
    activeSimulationId,
    resetForm,
    updateForm,
  } = useSimulationStore();

  // Pre-fill from contentId query param (future enhancement: fetch content by ID)
  React.useEffect(() => {
    if (contentId) {
      // Could fetch content details and pre-fill form here
      // For now, user will paste content manually
    }
  }, [contentId]);

  const handleNewSimulation = () => {
    resetForm();
  };

  const handleProgressComplete = () => {
    setStep("results");
  };

  if (!selectedBrand) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <SelectBrandPrompt />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={currentStep === "setup" ? "text-primary font-medium" : ""}>
          1. Setup
        </span>
        <span className="text-white/20">→</span>
        <span className={currentStep === "running" ? "text-primary font-medium" : ""}>
          2. Running
        </span>
        <span className="text-white/20">→</span>
        <span className={currentStep === "results" ? "text-primary font-medium" : ""}>
          3. Results
        </span>
      </div>

      {/* Step content */}
      {currentStep === "setup" && (
        <>
          <SimulationSetupForm />
          <SimulationHistory brandId={selectedBrand.id} />
        </>
      )}

      {currentStep === "running" && activeSimulationId && (
        <SimulationProgress
          simulationId={activeSimulationId}
          onComplete={handleProgressComplete}
        />
      )}

      {currentStep === "results" && activeSimulationId && (
        <SimulationResults
          simulationId={activeSimulationId}
          onNewSimulation={handleNewSimulation}
        />
      )}
    </div>
  );
}

import { Suspense } from 'react';
export default function SimulatePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <SimulatePageInner />
    </Suspense>
  );
}
