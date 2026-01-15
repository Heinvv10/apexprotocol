"use client";

import Link from "next/link";
import { TrendingUp, Users, BarChart3, DollarSign } from "lucide-react";

export default function CRMPage() {
  const modules = [
    {
      title: "Leads",
      description: "Manage your sales leads and track scoring",
      icon: Users,
      href: "/admin/crm/leads",
      stat: "0 leads",
    },
    {
      title: "Accounts",
      description: "Manage customer accounts and organizations",
      icon: TrendingUp,
      href: "/admin/crm/accounts",
      stat: "0 accounts",
    },
    {
      title: "Pipeline",
      description: "Track deals through sales stages",
      icon: BarChart3,
      href: "/admin/crm/pipeline",
      stat: "$0 in pipeline",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CRM</h1>
        <p className="text-muted-foreground mt-1">Customer relationship management hub</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modules.map(module => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <div className="card-secondary p-6 cursor-pointer hover:ring-2 hover:ring-red-500/30 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{module.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                  </div>
                  <Icon className="h-6 w-6 text-red-400" />
                </div>
                <p className="text-2xl font-bold text-red-400 mt-4">{module.stat}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
