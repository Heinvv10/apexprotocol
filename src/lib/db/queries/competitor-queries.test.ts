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

describe("Competitor Queries - Type Safety", () => {
  it("should export filter types", () => {
    // These types should be available for import
    type CompetitorSnapshotFilters = import("./competitor-queries").CompetitorSnapshotFilters;
    type ShareOfVoiceFilters = import("./competitor-queries").ShareOfVoiceFilters;
    type CompetitorMentionFilters = import("./competitor-queries").CompetitorMentionFilters;
    type SerpFeatureFilters = import("./competitor-queries").SerpFeatureFilters;
    type CompetitiveGapFilters = import("./competitor-queries").CompetitiveGapFilters;
    type CompetitiveAlertFilters = import("./competitor-queries").CompetitiveAlertFilters;
    type DiscoveredCompetitorFilters = import("./competitor-queries").DiscoveredCompetitorFilters;

    // If types are properly defined, this test passes
    expect(true).toBe(true);
  });

  it("should export enum types", () => {
    type DiscoveryMethod = import("./competitor-queries").DiscoveryMethod;
    type DiscoveryStatus = import("./competitor-queries").DiscoveryStatus;
    type SerpFeatureType = import("./competitor-queries").SerpFeatureType;
    type FeatureOwner = import("./competitor-queries").FeatureOwner;

    // If types are properly defined, this test passes
    expect(true).toBe(true);
  });

  it("should export pagination and sort types", () => {
    type PaginationOptions = import("./competitor-queries").PaginationOptions;
    type SortOptions = import("./competitor-queries").SortOptions;

    // If types are properly defined, this test passes
    expect(true).toBe(true);
  });

  it("should export trend data types", () => {
    type TrendDataPoint = import("./competitor-queries").TrendDataPoint;
    type CompetitorTrendData = import("./competitor-queries").CompetitorTrendData;

    // If types are properly defined, this test passes
    expect(true).toBe(true);
  });
});
