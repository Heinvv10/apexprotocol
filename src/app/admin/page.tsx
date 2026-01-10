"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Activity,
  TrendingUp,
  Server,
  Database,
  HardDrive,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

// Types for API responses
interface DashboardStats {
  totalOrganizations: number;
  organizationsThisMonth: number;
  totalUsers: number;
  usersThisWeek: number;
  activeSessions: number;
  apiRequests24h: number;
}

interface SystemHealth {
  apiServer: { status: string; uptime: string; responseTime: number };
  database: { status: string; latency: number; connected: boolean };
  redis: { status: string; connected: boolean; message: string };
  jobQueue: { status: string; pending: number };
  aiServices: { status: string; activeCount: number; errorCount: number };
}

interface ResourceUsage {
  database: { sizeFormatted: string; maxSizeFormatted: string; usagePercent: number };
  storage: { usedFormatted: string; maxFormatted: string; usagePercent: number };
  apiUsage: { requestsToday: number; usagePercent: number };
}

interface ActivityItem {
  id: string;
  actionFormatted: string;
  actorName: string;
  actorEmail: string;
  targetName: string;
  relativeTime: string;
}

// Stats card component following design system
function StatsCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  tier = "secondary",
  loading = false,
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  tier?: "primary" | "secondary" | "tertiary";
  loading?: boolean;
}) {
  const tierClasses = {
    primary: "card-primary",
    secondary: "card-secondary",
    tertiary: "card-tertiary",
  };

  return (
    <div className={tierClasses[tier]}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin mt-2 text-muted-foreground" />
          ) : (
            <>
              <p className="text-2xl font-bold mt-1">{value}</p>
              {change && (
                <p
                  className={`text-xs mt-1 ${
                    changeType === "positive"
                      ? "text-emerald-400"
                      : changeType === "negative"
                      ? "text-red-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {change}
                </p>
              )}
            </>
          )}
        </div>
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
        >
          <Icon className="h-5 w-5 text-red-400" />
        </div>
      </div>
    </div>
  );
}

// System health indicator
function HealthIndicator({
  label,
  status,
  value,
  loading = false,
}: {
  label: string;
  status: "healthy" | "warning" | "critical";
  value: string;
  loading?: boolean;
}) {
  const statusConfig = {
    healthy: { color: "text-emerald-400", bg: "bg-emerald-500/20", icon: CheckCircle },
    warning: { color: "text-amber-400", bg: "bg-amber-500/20", icon: AlertCircle },
    critical: { color: "text-red-400", bg: "bg-red-500/20", icon: AlertCircle },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded ${config.bg}`}>
          {loading ? (
            <Loader2 className={`h-4 w-4 animate-spin ${config.color}`} />
          ) : (
            <Icon className={`h-4 w-4 ${config.color}`} />
          )}
        </div>
        <span className="text-sm">{label}</span>
      </div>
      <span className={`text-sm font-medium ${config.color}`}>
        {loading ? "..." : value}
      </span>
    </div>
  );
}

// Recent activity item
function RecentActivityItem({
  action,
  target,
  user,
  time,
}: {
  action: string;
  target: string;
  user: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <div className="p-1.5 rounded bg-red-500/10">
        <Activity className="h-4 w-4 text-red-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{user}</span>{" "}
          <span className="text-muted-foreground">{action}</span>{" "}
          {target && <span className="font-medium">{target}</span>}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {time}
        </p>
      </div>
    </div>
  );
}

// ðŸŸ¢ WORKING: Migrated to centralized formatters
// formatNumber is now imported from @/lib/utils with abbreviation support

export default function AdminDashboardPage() {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [health, setHealth] = React.useState<SystemHealth | null>(null);
  const [resources, setResources] = React.useState<ResourceUsage | null>(null);
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch all dashboard data
  const fetchDashboardData = React.useCallback(async () => {
    try {
      setError(null);

      const [statsRes, healthRes, resourcesRes, activityRes] = await Promise.all([
        fetch("/api/admin/dashboard/stats"),
        fetch("/api/admin/dashboard/health"),
        fetch("/api/admin/dashboard/resources"),
        fetch("/api/admin/dashboard/activity?limit=5"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData.health);
      }

      if (resourcesRes.ok) {
        const resourcesData = await resourcesRes.json();
        setResources(resourcesData.resources);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivities(activityData.activities || []);
      }
    } catch (err) {
      setError("Failed to fetch dashboard data");
      // Error logged to monitoring system
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch and auto-refresh every 30 seconds
  React.useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  return (
    <div className="space-y-6 relative">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            APEX
          </span>
          <span className="text-xl font-light text-foreground ml-1">Admin</span>
          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded border border-red-500/30">
            SUPER ADMIN
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-white/10 hover:bg-white/5"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          <p className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        </div>
      )}

      {/* Key Metrics - Primary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Organizations"
          value={stats?.totalOrganizations ?? 0}
          change={stats ? `+${stats.organizationsThisMonth} this month` : undefined}
          changeType="positive"
          icon={Building2}
          tier="primary"
          loading={loading}
        />
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          change={stats ? `+${stats.usersThisWeek} this week` : undefined}
          changeType="positive"
          icon={Users}
          tier="primary"
          loading={loading}
        />
        <StatsCard
          title="Active Sessions"
          value={stats?.activeSessions ?? 0}
          change="Real-time"
          changeType="neutral"
          icon={Activity}
          tier="primary"
          loading={loading}
        />
        <StatsCard
          title="API Requests (24h)"
          value={formatNumber(stats?.apiRequests24h ?? 0, { abbreviate: true })}
          change="From audit logs"
          changeType="neutral"
          icon={TrendingUp}
          tier="primary"
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health - Secondary Card */}
        <div className="lg:col-span-1 card-secondary">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="h-5 w-5 text-red-400" />
            System Health
          </h3>
          <div className="space-y-3">
            <HealthIndicator
              label="API Server"
              status={(health?.apiServer.status as "healthy" | "warning" | "critical") || "healthy"}
              value={health ? `${health.apiServer.uptime} uptime` : "..."}
              loading={loading}
            />
            <HealthIndicator
              label="Database"
              status={(health?.database.status as "healthy" | "warning" | "critical") || "healthy"}
              value={health ? `${health.database.latency}ms latency` : "..."}
              loading={loading}
            />
            <HealthIndicator
              label="Redis Cache"
              status={(health?.redis.status as "healthy" | "warning" | "critical") || "warning"}
              value={health?.redis.message || "..."}
              loading={loading}
            />
            <HealthIndicator
              label="Job Queue"
              status={(health?.jobQueue.status as "healthy" | "warning" | "critical") || "healthy"}
              value={health ? `${health.jobQueue.pending} pending` : "..."}
              loading={loading}
            />
            <HealthIndicator
              label="AI Services"
              status={(health?.aiServices.status as "healthy" | "warning" | "critical") || "healthy"}
              value={health ? `${health.aiServices.activeCount} active` : "..."}
              loading={loading}
            />
          </div>
        </div>

        {/* Resource Usage - Secondary Card */}
        <div className="lg:col-span-1 card-secondary">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-red-400" />
            Resource Usage
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Database</span>
                <span>{resources?.database.sizeFormatted || "..."} / {resources?.database.maxSizeFormatted || "..."}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${resources?.database.usagePercent || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Storage</span>
                <span>{resources?.storage.usedFormatted || "..."} / {resources?.storage.maxFormatted || "..."}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${resources?.storage.usagePercent || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">API Requests Today</span>
                <span>{formatNumber(resources?.apiUsage.requestsToday || 0, { abbreviate: true })}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${Math.min(resources?.apiUsage.usagePercent || 0, 100)}%` }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-white/10 mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Database Size
                </span>
                <span>{resources?.database.sizeFormatted || "..."}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity - Secondary Card */}
        <div className="lg:col-span-1 card-secondary">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-400" />
            Recent Admin Activity
          </h3>
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              activities.map((activity) => (
                <RecentActivityItem
                  key={activity.id}
                  action={activity.actionFormatted}
                  target={activity.targetName}
                  user={activity.actorName || activity.actorEmail}
                  time={activity.relativeTime}
                />
              ))
            )}
          </div>
          {activities.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <Link
                href="/admin/audit-logs"
                className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                View all activity
                <span aria-hidden="true">â†’</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-secondary">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/admin/organizations">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex-col gap-2 border-white/10 hover:bg-white/5 hover:border-red-500/30"
            >
              <Building2 className="h-5 w-5 text-red-400" />
              <span className="text-xs">Organizations</span>
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex-col gap-2 border-white/10 hover:bg-white/5 hover:border-red-500/30"
            >
              <Users className="h-5 w-5 text-red-400" />
              <span className="text-xs">Manage Users</span>
            </Button>
          </Link>
          <Link href="/admin/audit-logs">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex-col gap-2 border-white/10 hover:bg-white/5 hover:border-red-500/30"
            >
              <FileText className="h-5 w-5 text-red-400" />
              <span className="text-xs">Audit Logs</span>
            </Button>
          </Link>
          <Link href="/admin/api-config">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex-col gap-2 border-white/10 hover:bg-white/5 hover:border-red-500/30"
            >
              <Settings className="h-5 w-5 text-red-400" />
              <span className="text-xs">API Config</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
