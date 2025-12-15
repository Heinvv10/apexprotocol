"use client";

import * as React from "react";
import {
  Zap,
  ZapOff,
  Wifi,
  WifiOff,
  AlertTriangle,
  Battery,
  BatteryLow,
  Cloud,
  CloudOff,
  Image,
  ImageOff,
  RefreshCw,
  Clock,
  Bell,
  Info,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Export interface for API integration
export interface LoadsheddingSchedule {
  stage: number;
  startTime: string;
  endTime: string;
  area: string;
}

interface ConnectivitySettingsProps {
  className?: string;
  schedule?: LoadsheddingSchedule[];
}

export function ConnectivitySettings({ className, schedule }: ConnectivitySettingsProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <LoadsheddingModeSection schedule={schedule} />
      <LowBandwidthModeSection />
      <DataSaverSection />
    </div>
  );
}

interface LoadsheddingModeSectionProps {
  schedule?: LoadsheddingSchedule[];
}

// F051 - Loadshedding Mode Toggle
export function LoadsheddingModeSection({ schedule }: LoadsheddingModeSectionProps) {
  // TODO: Fetch loadshedding schedule from API endpoint
  // const { data: scheduleData } = useQuery(['loadsheddingSchedule'], fetchLoadsheddingSchedule);
  const scheduleData = schedule || []; // Empty array - no mock data
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [showNotification, setShowNotification] = React.useState(false);

  const handleToggle = () => {
    setIsEnabled(!isEnabled);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  return (
    <div className="card-secondary p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isEnabled ? "bg-warning/20 text-warning" : "bg-muted/20 text-muted-foreground"
            )}
          >
            {isEnabled ? (
              <ZapOff className="w-5 h-5" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Loadshedding Mode
            </h3>
            <p className="text-sm text-muted-foreground">
              Optimize for South African power outages
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <ToggleSwitch checked={isEnabled} onChange={handleToggle} />
      </div>

      {/* Features enabled in loadshedding mode */}
      <div className="space-y-3">
        <FeatureItem
          icon={BatteryLow}
          label="Battery-saving mode"
          description="Reduces background processes and animations"
          enabled={isEnabled}
        />
        <FeatureItem
          icon={CloudOff}
          label="Offline caching"
          description="Pre-downloads critical data for offline access"
          enabled={isEnabled}
        />
        <FeatureItem
          icon={Clock}
          label="Auto-pause during outages"
          description="Pauses syncs during scheduled loadshedding"
          enabled={isEnabled}
        />
        <FeatureItem
          icon={Bell}
          label="Outage notifications"
          description="Alerts before scheduled loadshedding"
          enabled={isEnabled}
        />
      </div>

      {/* Loadshedding Schedule */}
      {isEnabled && scheduleData.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-warning">
              Upcoming Outages (Stage {scheduleData[0].stage})
            </span>
          </div>
          <div className="space-y-1">
            {scheduleData.map((slot, idx) => (
              <p key={idx} className="text-xs text-foreground">
                {slot.startTime} - {slot.endTime} ({slot.area})
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border shadow-lg">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isEnabled ? "bg-warning/20" : "bg-success/20"
              )}
            >
              {isEnabled ? (
                <ZapOff className="w-4 h-4 text-warning" />
              ) : (
                <Zap className="w-4 h-4 text-success" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Loadshedding Mode {isEnabled ? "Enabled" : "Disabled"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isEnabled
                  ? "Reduced data mode activated"
                  : "Normal mode restored"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// F052 - Low-bandwidth Mode Toggle
export function LowBandwidthModeSection() {
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [showNotification, setShowNotification] = React.useState(false);

  const handleToggle = () => {
    setIsEnabled(!isEnabled);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  return (
    <div className="card-secondary p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isEnabled ? "bg-accent-blue/20 text-accent-blue" : "bg-muted/20 text-muted-foreground"
            )}
          >
            {isEnabled ? (
              <WifiOff className="w-5 h-5" />
            ) : (
              <Wifi className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Low-Bandwidth Mode
            </h3>
            <p className="text-sm text-muted-foreground">
              Optimized for slow or expensive data connections
            </p>
          </div>
        </div>

        <ToggleSwitch checked={isEnabled} onChange={handleToggle} />
      </div>

      <div className="space-y-3">
        <FeatureItem
          icon={ImageOff}
          label="Compressed images"
          description="Loads lower resolution images to save data"
          enabled={isEnabled}
        />
        <FeatureItem
          icon={RefreshCw}
          label="Reduced sync frequency"
          description="Syncs less often to conserve bandwidth"
          enabled={isEnabled}
        />
        <FeatureItem
          icon={Cloud}
          label="On-demand loading"
          description="Only loads data when explicitly requested"
          enabled={isEnabled}
        />
      </div>

      {/* Data usage indicator */}
      {isEnabled && (
        <div className="mt-4 p-3 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-accent-blue">
              Compressed Assets Active
            </span>
            <span className="text-xs text-muted-foreground">~60% data saved</span>
          </div>
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
            <div className="h-full w-[40%] bg-accent-blue rounded-full" />
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border shadow-lg">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isEnabled ? "bg-accent-blue/20" : "bg-success/20"
              )}
            >
              {isEnabled ? (
                <WifiOff className="w-4 h-4 text-accent-blue" />
              ) : (
                <Wifi className="w-4 h-4 text-success" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Low-Bandwidth Mode {isEnabled ? "Enabled" : "Disabled"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isEnabled
                  ? "Compressed assets indicator active"
                  : "Full quality restored"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DataSaverSection() {
  const [autoDetect, setAutoDetect] = React.useState(true);

  return (
    <div className="card-tertiary p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-foreground">Auto-detect connection</span>
        </div>
        <ToggleSwitch
          checked={autoDetect}
          onChange={() => setAutoDetect(!autoDetect)}
          size="sm"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2 ml-6">
        Automatically switch modes based on network conditions
      </p>
    </div>
  );
}

function FeatureItem({
  icon: Icon,
  label,
  description,
  enabled,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-2 rounded-lg transition-colors",
        enabled ? "bg-muted/10" : "opacity-50"
      )}
    >
      <div
        className={cn(
          "w-6 h-6 rounded flex items-center justify-center mt-0.5",
          enabled ? "bg-success/20 text-success" : "bg-muted/20 text-muted-foreground"
        )}
      >
        {enabled ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  size?: "sm" | "md";
}

function ToggleSwitch({ checked, onChange, size = "md" }: ToggleSwitchProps) {
  const dimensions = size === "sm" ? "w-9 h-5" : "w-11 h-6";
  const thumbSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const thumbTranslate = size === "sm" ? "translate-x-4" : "translate-x-5";

  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        "relative rounded-full transition-colors",
        dimensions,
        checked ? "bg-primary" : "bg-muted/40"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 rounded-full bg-white shadow transition-transform",
          thumbSize,
          checked && thumbTranslate
        )}
      />
    </button>
  );
}

// Compact indicator for header/navbar
export function ConnectivityIndicator({ className }: { className?: string }) {
  const [loadsheddingMode, setLoadsheddingMode] = React.useState(false);
  const [lowBandwidthMode, setLowBandwidthMode] = React.useState(false);

  if (!loadsheddingMode && !lowBandwidthMode) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {loadsheddingMode && (
        <div
          className="p-1.5 rounded bg-warning/20 text-warning"
          title="Loadshedding Mode Active"
        >
          <ZapOff className="w-3.5 h-3.5" />
        </div>
      )}
      {lowBandwidthMode && (
        <div
          className="p-1.5 rounded bg-accent-blue/20 text-accent-blue"
          title="Low-Bandwidth Mode Active"
        >
          <WifiOff className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
}
