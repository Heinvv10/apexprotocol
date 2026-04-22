/**
 * Competitor Queries Unit Tests
 *
 * Tests that competitor query functions are properly exported and have correct signatures.
 * These are basic smoke tests that verify the API surface without requiring a database connection.
 */

import { describe, it, expect } from "vitest";
import * as competitorQueries from "./competitor-queries";

describe("Competitor Queries - Module Exports", () => {
  it("should export createCompetitorSnapshot function", () => {
    expect(competitorQueries.createCompetitorSnapshot).toBeDefined();
    expect(typeof competitorQueries.createCompetitorSnapshot).toBe("function");
  });

  it("should export createCompetitorSnapshots function", () => {
    expect(competitorQueries.createCompetitorSnapshots).toBeDefined();
    expect(typeof competitorQueries.createCompetitorSnapshots).toBe("function");
  });

  it("should export getCompetitorSnapshots function", () => {
    expect(competitorQueries.getCompetitorSnapshots).toBeDefined();
    expect(typeof competitorQueries.getCompetitorSnapshots).toBe("function");
  });

  it("should export getLatestCompetitorSnapshot function", () => {
    expect(competitorQueries.getLatestCompetitorSnapshot).toBeDefined();
    expect(typeof competitorQueries.getLatestCompetitorSnapshot).toBe("function");
  });

  it("should export getCompetitorSnapshotsForTrends function", () => {
    expect(competitorQueries.getCompetitorSnapshotsForTrends).toBeDefined();
    expect(typeof competitorQueries.getCompetitorSnapshotsForTrends).toBe("function");
  });

  it("should export getCompetitorTrendData function", () => {
    expect(competitorQueries.getCompetitorTrendData).toBeDefined();
    expect(typeof competitorQueries.getCompetitorTrendData).toBe("function");
  });

  it("should export getTrackedCompetitors function", () => {
    expect(competitorQueries.getTrackedCompetitors).toBeDefined();
    expect(typeof competitorQueries.getTrackedCompetitors).toBe("function");
  });

  it("should export Share of Voice functions", () => {
    expect(competitorQueries.createShareOfVoice).toBeDefined();
    expect(competitorQueries.getShareOfVoice).toBeDefined();
    expect(competitorQueries.getLatestShareOfVoice).toBeDefined();
    expect(competitorQueries.getShareOfVoiceTrend).toBeDefined();
  });

  it("should export Competitor Mentions functions", () => {
    expect(competitorQueries.createCompetitorMention).toBeDefined();
    expect(competitorQueries.getCompetitorMentions).toBeDefined();
    expect(competitorQueries.getCompetitorMentionCounts).toBeDefined();
  });

  it("should export SERP Features functions", () => {
    expect(competitorQueries.createSerpFeature).toBeDefined();
    expect(competitorQueries.getSerpFeatures).toBeDefined();
    expect(competitorQueries.getOwnedSerpFeatures).toBeDefined();
    expect(competitorQueries.getCompetitorSerpFeatures).toBeDefined();
  });

  it("should export Competitive Gaps functions", () => {
    expect(competitorQueries.createCompetitiveGap).toBeDefined();
    expect(competitorQueries.getCompetitiveGaps).toBeDefined();
    expect(competitorQueries.getUnresolvedCompetitiveGaps).toBeDefined();
    expect(competitorQueries.resolveCompetitiveGap).toBeDefined();
  });

  it("should export Competitive Alerts functions", () => {
    expect(competitorQueries.createCompetitiveAlert).toBeDefined();
    expect(competitorQueries.getCompetitiveAlerts).toBeDefined();
    expect(competitorQueries.getUnreadCompetitiveAlerts).toBeDefined();
    expect(competitorQueries.markAlertAsRead).toBeDefined();
    expect(competitorQueries.dismissAlert).toBeDefined();
  });

  it("should export Discovered Competitors functions", () => {
    expect(competitorQueries.createDiscoveredCompetitor).toBeDefined();
    expect(competitorQueries.getDiscoveredCompetitors).toBeDefined();
    expect(competitorQueries.getPendingDiscoveredCompetitors).toBeDefined();
    expect(competitorQueries.updateDiscoveredCompetitorStatus).toBeDefined();
  });

  it("should export batch create functions", () => {
    expect(competitorQueries.createCompetitorSnapshots).toBeDefined();
    expect(competitorQueries.createShareOfVoiceRecords).toBeDefined();
    expect(competitorQueries.createCompetitorMentions).toBeDefined();
    expect(competitorQueries.createSerpFeatures).toBeDefined();
    expect(competitorQueries.createCompetitiveGaps).toBeDefined();
    expect(competitorQueries.createCompetitiveAlerts).toBeDefined();
    expect(competitorQueries.createDiscoveredCompetitors).toBeDefined();
  });
});

// Type-export checks previously lived here as four expect(true).toBe(true) tests.
// Type availability is already enforced by tsc at build time — redundant asserts
// removed rather than kept as always-passing placeholders.
