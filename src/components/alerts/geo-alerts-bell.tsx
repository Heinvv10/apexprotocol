"use client";

/**
 * GEO Alerts Bell Component
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 *
 * A bell icon in the header that shows GEO alerts count and opens the alerts panel.
 */

import React from "react";
import { useAlertsPanel } from "@/hooks/useGeoAlerts";
import { useSelectedBrand } from "@/stores";
import { AlertsPanel } from "./alerts-panel";

export function GeoAlertsBell() {
  const selectedBrand = useSelectedBrand();
  const {
    alerts,
    summary,
    isLoading,
    refresh,
    markAsRead,
    dismiss,
    markAllRead,
    dismissAll,
  } = useAlertsPanel(selectedBrand?.id);

  return (
    <AlertsPanel
      alerts={alerts}
      summary={summary}
      isLoading={isLoading}
      onRefresh={refresh}
      onRead={markAsRead}
      onDismiss={dismiss}
      onMarkAllRead={markAllRead}
      onDismissAll={dismissAll}
    />
  );
}

export default GeoAlertsBell;
