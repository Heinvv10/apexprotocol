import Link from "next/link";
import { BarChart3, Eye, Users, Activity, ArrowRight } from "lucide-react";

const sections = [
  {
    href: "/admin/platform-monitoring/multi-platform-dashboard",
    title: "Multi-Platform Dashboard",
    description: "Unified overview of visibility across every monitored AI platform.",
    icon: BarChart3,
  },
  {
    href: "/admin/platform-monitoring/our-visibility",
    title: "Our Visibility",
    description: "How our brand surfaces across AI platforms — mentions, rank, sentiment.",
    icon: Eye,
  },
  {
    href: "/admin/platform-monitoring/competitor-visibility",
    title: "Competitor Visibility",
    description: "Track how competitor brands appear in AI responses.",
    icon: Users,
  },
  {
    href: "/admin/platform-monitoring/content-performance",
    title: "Content Performance",
    description: "Which content pieces drive the most AI citations.",
    icon: Activity,
  },
];

export default function PlatformMonitoringHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Platform Monitoring
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dashboards for tracking how Apex and competitor brands surface across
          every monitored AI platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="card-secondary p-5 flex items-start gap-4 transition-colors hover:bg-card/80 group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  {title}
                </h2>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
