"use client";

import * as React from "react";
import { Plus, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { BrandHeader } from "@/components/layout/brand-header";
import { Button } from "@/components/ui/button";
import { useSelectedBrand } from "@/stores";
import { ScheduleModal } from "@/components/audit/ScheduleModal";
import { ScheduledAuditsList } from "@/components/audit/ScheduledAuditsList";
import { AuditTrendChart } from "@/components/audit/AuditTrendChart";
import { useAuditsByBrand } from "@/hooks/useAudit";
import { ScheduleConfig } from "@/hooks/useSchedules";

// Select brand prompt
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
            <Clock className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">No Brand Selected</h2>
          <p className="text-muted-foreground">
            Choose a brand from the header dropdown to view and manage scheduled audits.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ScheduledAuditsPage() {
  const selectedBrand = useSelectedBrand();
  const { data: auditResponse, isLoading } = useAuditsByBrand(selectedBrand?.id || "");
  const audits = auditResponse?.audits ?? [];

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingSchedule, setEditingSchedule] = React.useState<ScheduleConfig | null>(null);

  // Show brand selection prompt if no brand selected
  if (!selectedBrand) {
    return (
      <div className="space-y-6 relative">
        {/* Header */}
        <BrandHeader pageName="Scheduled Audits" />

        <SelectBrandPrompt />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduled Audits</h1>
          <p className="text-muted-foreground mt-2">
            Automate your site audits with recurring schedules
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingSchedule(null);
            setIsModalOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Schedule
        </Button>
      </div>

      {/* Info Card */}
      <div className="card-primary p-4 border border-primary/20 flex items-start gap-3">
        <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-sm">Continuous Monitoring</p>
          <p className="text-sm text-muted-foreground">
            Set up automated audits to monitor your site's health over time. Get insights into improvements and regressions with trend tracking.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedules List - 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Your Schedules</h2>
          <ScheduledAuditsList
            onEditClick={(schedule) => {
              setEditingSchedule(schedule);
              setIsModalOpen(true);
            }}
          />
        </div>

        {/* Quick Stats - 1 column */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase">Quick Stats</h3>

          {/* Total Audits */}
          <div className="card-secondary p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Audits</p>
                <p className="text-2xl font-bold">{audits?.length || 0}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>

          {/* Latest Score */}
          {audits && audits.length > 0 && (
            <div className="card-secondary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Latest Score</p>
                  <p className="text-2xl font-bold text-primary">
                    {audits[audits.length - 1]?.overallScore || "N/A"}
                  </p>
                </div>
                <div className={`text-xs font-semibold px-2 py-1 rounded ${
                  (audits[audits.length - 1]?.overallScore || 0) >= 80
                    ? "bg-success/10 text-success"
                    : (audits[audits.length - 1]?.overallScore || 0) >= 60
                    ? "bg-warning/10 text-warning"
                    : "bg-error/10 text-error"
                }`}>
                  {(audits[audits.length - 1]?.overallScore || 0) >= 90
                    ? "A+"
                    : (audits[audits.length - 1]?.overallScore || 0) >= 80
                    ? "A"
                    : (audits[audits.length - 1]?.overallScore || 0) >= 70
                    ? "B"
                    : (audits[audits.length - 1]?.overallScore || 0) >= 60
                    ? "C"
                    : (audits[audits.length - 1]?.overallScore || 0) >= 50
                    ? "D"
                    : "F"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trends Section */}
      {audits && audits.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Audit Trends</h2>
          <AuditTrendChart audits={audits} />
        </div>
      )}

      {/* Empty State */}
      {(!audits || audits.length === 0) && !isLoading && (
        <div className="card-tertiary p-8 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No Audits Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a schedule to start tracking your site's health over time.
          </p>
          <Button
            onClick={() => {
              setEditingSchedule(null);
              setIsModalOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Your First Schedule
          </Button>
        </div>
      )}

      {/* Modal */}
      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSchedule(null);
        }}
        schedule={editingSchedule}
        onSuccess={() => {
          setEditingSchedule(null);
        }}
      />
    </div>
  );
}
