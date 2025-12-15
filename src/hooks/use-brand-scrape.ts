/**
 * Brand Scrape Hook
 * Manages the brand scraping workflow with polling for job status
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ScrapedBrandData, ScrapeJobStatus } from "@/app/api/brands/scrape/route";

// Scrape job state
export interface ScrapeJobState {
  jobId: string | null;
  status: ScrapeJobStatus | "idle";
  progress: number;
  progressMessage: string;
  data: ScrapedBrandData | null;
  error: string | null;
}

// Hook return type
export interface UseBrandScrapeReturn {
  state: ScrapeJobState;
  startScrape: (url: string) => Promise<void>;
  cancelScrape: () => void;
  reset: () => void;
  isLoading: boolean;
  isComplete: boolean;
  isError: boolean;
}

// Initial state
const initialState: ScrapeJobState = {
  jobId: null,
  status: "idle",
  progress: 0,
  progressMessage: "",
  data: null,
  error: null,
};

// Polling interval in ms
const POLL_INTERVAL = 1000;
const MAX_POLL_TIME = 60000; // 60 seconds max polling

/**
 * Hook for managing brand scraping workflow
 */
export function useBrandScrape(): UseBrandScrapeReturn {
  const [state, setState] = useState<ScrapeJobState>(initialState);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  /**
   * Start polling for job status
   */
  const startPolling = useCallback((jobId: string) => {
    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    startTimeRef.current = Date.now();

    const poll = async () => {
      try {
        // Check for timeout
        if (Date.now() - startTimeRef.current > MAX_POLL_TIME) {
          setState((prev) => ({
            ...prev,
            status: "failed",
            error: "Request timed out. Please try again.",
          }));
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
          return;
        }

        const response = await fetch(`/api/brands/scrape/${jobId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to get job status");
        }

        const job = result.job;

        setState((prev) => ({
          ...prev,
          status: job.status,
          progress: job.progress,
          progressMessage: job.progressMessage,
          data: job.data || null,
          error: job.error || null,
        }));

        // Stop polling if job is complete or failed
        if (job.status === "completed" || job.status === "failed") {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
        }
      } catch (error) {
        console.error("[useBrandScrape] Polling error:", error);
        setState((prev) => ({
          ...prev,
          status: "failed",
          error: error instanceof Error ? error.message : "An error occurred",
        }));
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      }
    };

    // Initial poll
    poll();

    // Start interval polling
    pollingRef.current = setInterval(poll, POLL_INTERVAL);
  }, []);

  /**
   * Start the scraping process
   */
  const startScrape = useCallback(
    async (url: string) => {
      // Reset state
      setState({
        ...initialState,
        status: "pending",
        progress: 5,
        progressMessage: "Starting website analysis...",
      });

      try {
        // Validate URL
        let normalizedUrl = url.trim();
        if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
          normalizedUrl = `https://${normalizedUrl}`;
        }

        // Start the scrape job
        const response = await fetch("/api/brands/scrape", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: normalizedUrl }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to start scraping");
        }

        // Update state with job ID
        setState((prev) => ({
          ...prev,
          jobId: result.jobId,
          status: "pending",
          progress: 10,
          progressMessage: "Job started, fetching website...",
        }));

        // Start polling for job status
        startPolling(result.jobId);
      } catch (error) {
        console.error("[useBrandScrape] Start error:", error);
        setState((prev) => ({
          ...prev,
          status: "failed",
          error: error instanceof Error ? error.message : "Failed to start scraping",
        }));
      }
    },
    [startPolling]
  );

  /**
   * Cancel the current scraping job
   */
  const cancelScrape = useCallback(() => {
    // Stop polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // If we have a job ID, try to delete it
    if (state.jobId) {
      fetch(`/api/brands/scrape/${state.jobId}`, { method: "DELETE" }).catch(
        console.error
      );
    }

    // Reset state
    setState(initialState);
  }, [state.jobId]);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    // Stop polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    setState(initialState);
  }, []);

  // Computed states
  const isLoading = state.status === "pending" || state.status === "processing";
  const isComplete = state.status === "completed";
  const isError = state.status === "failed";

  return {
    state,
    startScrape,
    cancelScrape,
    reset,
    isLoading,
    isComplete,
    isError,
  };
}
