"use client";

import * as React from "react";
import {
  User,
  Building2,
  Bell,
  Shield,
  Palette,
  Plug,
  CreditCard,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SettingsSection {
  id: string;
  label: string;
  icon: React.ElementType;
  description?: string;
}

export const settingsSections: SettingsSection[] = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
    description: "Manage your personal information",
  },
  {
    id: "organization",
    label: "Organization",
    icon: Building2,
    description: "Team and company settings",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Alert and email preferences",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "Password and authentication",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    description: "Theme and display options",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Plug,
    description: "Connected apps and services",
  },
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
    description: "Plan and payment details",
  },
  {
    id: "help",
    label: "Help & Support",
    icon: HelpCircle,
    description: "Documentation and contact",
  },
];

interface SettingsSidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  className?: string;
}

export function SettingsSidebar({
  activeSection,
  onSectionChange,
  className,
}: SettingsSidebarProps) {
  return (
    <div className={cn("w-64 flex-shrink-0", className)}>
      <div className="card-secondary h-full">
        <h3 className="font-medium text-foreground mb-4">Settings</h3>
        <nav className="space-y-1">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
