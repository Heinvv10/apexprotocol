"use client";

import * as React from "react";
import {
  Building2,
  Users,
  Activity,
  TrendingUp,
  Server,
  Database,
  Cpu,
  HardDrive,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Stats card component following design system
function StatsCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  tier = "secondary",
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  tier?: "primary" | "secondary" | "tertiary";
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
}: {
  label: string;
  status: "healthy" | "warning" | "critical";
  value: string;
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
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>
        <span className="text-sm">{label}</span>
      </div>
      <span className={`text-sm font-medium ${config.color}`}>{value}</span>
    </div>
  );
}

// Recent activity item
function ActivityItem({
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
          <span className="font-medium">{target}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {time}
        </p>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
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
            className="border-white/10 hover:bg-white/5"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics - Primary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Organizations"
          value="24"
          change="+3 this month"
          changeType="positive"
          icon={Building2}
          tier="primary"
        />
        <StatsCard
          title="Total Users"
          value="156"
          change="+12 this week"
          changeType="positive"
          icon={Users}
          tier="primary"
        />
        <StatsCard
          title="Active Sessions"
          value="42"
          change="Real-time"
          changeType="neutral"
          icon={Activity}
          tier="primary"
        />
        <StatsCard
          title="API Requests (24h)"
          value="12.4K"
          change="+8% vs yesterday"
          changeType="positive"
          icon={TrendingUp}
          tier="primary"
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
            <HealthIndicator label="API Server" status="healthy" value="99.9% uptime" />
            <HealthIndicator label="Database" status="healthy" value="45ms latency" />
            <HealthIndicator label="Redis Cache" status="healthy" value="Connected" />
            <HealthIndicator label="Job Queue" status="warning" value="12 pending" />
            <HealthIndicator label="AI Services" status="healthy" value="All online" />
          </div>
        </div>

        {/* Resource Usage - Secondary Card */}
        <div className="lg:col-span-1 card-secondary">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-red-400" />
            Resource Usage
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">CPU Usage</span>
                <span>34%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{ width: "34%" }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Memory</span>
                <span>62%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                  style={{ width: "62%" }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Storage</span>
                <span>28%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                  style={{ width: "28%" }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-white/10 mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Database Size
                </span>
                <span>2.4 GB / 10 GB</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  File Storage
                </span>
                <span>8.2 GB / 50 GB</span>
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
            <ActivityItem
              action="upgraded plan for"
              target="Acme Corp"
              user="admin@apex.io"
              time="5 minutes ago"
            />
            <ActivityItem
              action="enabled feature flag"
              target="osint_deep_scan"
              user="admin@apex.io"
              time="1 hour ago"
            />
            <ActivityItem
              action="created organization"
              target="TechStart Inc"
              user="admin@apex.io"
              time="3 hours ago"
            />
            <ActivityItem
              action="modified API limits for"
              target="Enterprise Plan"
              user="admin@apex.io"
              time="Yesterday"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-secondary">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2 border-white/10 hover:bg-white/5 hover:border-red-500/30"
          >
            <Building2 className="h-5 w-5 text-red-400" />
            <span className="text-xs">New Organization</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2 border-white/10 hover:bg-white/5 hover:border-red-500/30"
          >
            <Users className="h-5 w-5 text-red-400" />
            <span className="text-xs">Manage Users</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2 border-white/10 hover:bg-white/5 hover:border-red-500/30"
          >
            <Activity className="h-5 w-5 text-red-400" />
            <span className="text-xs">View Logs</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2 border-white/10 hover:bg-white/5 hover:border-red-500/30"
          >
            <Server className="h-5 w-5 text-red-400" />
            <span className="text-xs">System Settings</span>
          </Button>
        </div>
      </div>

    </div>
  );
}
