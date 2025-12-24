import Link from "next/link";
import { ArrowLeft, Code2 } from "lucide-react";

interface DeveloperSettingsLayoutProps {
  children: React.ReactNode;
}

export default function DeveloperSettingsLayout({
  children,
}: DeveloperSettingsLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-4">
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Code2 className="w-4 h-4" />
          <span>Developer</span>
        </div>
      </nav>

      {/* Page Content */}
      {children}
    </div>
  );
}
