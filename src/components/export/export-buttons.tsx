"use client";

import * as React from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Check,
  Loader2,
  FileJson,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ExportFormat = "csv" | "pdf" | "json" | "png";

interface ExportOption {
  id: ExportFormat;
  label: string;
  description: string;
  icon: React.ElementType;
}

const exportOptions: ExportOption[] = [
  {
    id: "csv",
    label: "CSV",
    description: "Spreadsheet format",
    icon: FileSpreadsheet,
  },
  {
    id: "pdf",
    label: "PDF",
    description: "Document format",
    icon: FileText,
  },
  {
    id: "json",
    label: "JSON",
    description: "Raw data format",
    icon: FileJson,
  },
  {
    id: "png",
    label: "PNG",
    description: "Image format",
    icon: Image,
  },
];

interface ExportButtonProps {
  onExport: (format: ExportFormat) => void | Promise<void>;
  formats?: ExportFormat[];
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function ExportButton({
  onExport,
  formats = ["csv", "pdf"],
  label = "Export",
  disabled = false,
  className,
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState<ExportFormat | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const availableOptions = exportOptions.filter((opt) =>
    formats.includes(opt.id)
  );

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(format);
    try {
      await onExport(format);
    } finally {
      setIsExporting(null);
      setIsOpen(false);
    }
  };

  // Single format - just a button
  if (availableOptions.length === 1) {
    const format = availableOptions[0];
    const Icon = format.icon;
    return (
      <button
        onClick={() => handleExport(format.id)}
        disabled={disabled || isExporting !== null}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          "bg-white/5 hover:bg-white/10 text-foreground border border-border/50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        {isExporting === format.id ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
        {label} {format.label}
      </button>
    );
  }

  // Multiple formats - dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting !== null}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          "bg-white/5 hover:bg-white/10 text-foreground border border-border/50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen && "bg-white/10",
          className
        )}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {label}
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border/50 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {availableOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => handleExport(option.id)}
                disabled={isExporting !== null}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {option.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
                {isExporting === option.id && (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Quick export buttons for toolbar
export function ExportToolbar({
  onExport,
  formats = ["csv", "pdf"],
  className,
}: {
  onExport: (format: ExportFormat) => void | Promise<void>;
  formats?: ExportFormat[];
  className?: string;
}) {
  const [isExporting, setIsExporting] = React.useState<ExportFormat | null>(null);

  const availableOptions = exportOptions.filter((opt) =>
    formats.includes(opt.id)
  );

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(format);
    try {
      await onExport(format);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {availableOptions.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            onClick={() => handleExport(option.id)}
            disabled={isExporting !== null}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors disabled:opacity-50"
            title={`Export as ${option.label}`}
          >
            {isExporting === option.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Icon className="w-3.5 h-3.5" />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// Export modal for advanced options
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat, options: ExportOptions) => void | Promise<void>;
  title?: string;
  formats?: ExportFormat[];
}

interface ExportOptions {
  dateRange?: "all" | "last7days" | "last30days" | "custom";
  includeCharts?: boolean;
  includeRawData?: boolean;
}

export function ExportModal({
  isOpen,
  onClose,
  onExport,
  title = "Export Data",
  formats = ["csv", "pdf", "json"],
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = React.useState<ExportFormat>(formats[0]);
  const [options, setOptions] = React.useState<ExportOptions>({
    dateRange: "all",
    includeCharts: true,
    includeRawData: false,
  });
  const [isExporting, setIsExporting] = React.useState(false);

  const availableOptions = exportOptions.filter((opt) =>
    formats.includes(opt.id)
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(selectedFormat, options);
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>

          {/* Format selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {availableOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedFormat === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedFormat(option.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-border bg-background"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-primary" : "text-foreground"
                      )}
                    >
                      {option.label}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Date Range
            </label>
            <select
              value={options.dateRange}
              onChange={(e) =>
                setOptions({ ...options, dateRange: e.target.value as ExportOptions["dateRange"] })
              }
              className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All time</option>
              <option value="last7days">Last 7 days</option>
              <option value="last30days">Last 30 days</option>
            </select>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeCharts}
                onChange={(e) =>
                  setOptions({ ...options, includeCharts: e.target.checked })
                }
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">Include charts</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeRawData}
                onChange={(e) =>
                  setOptions({ ...options, includeRawData: e.target.checked })
                }
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">Include raw data</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
