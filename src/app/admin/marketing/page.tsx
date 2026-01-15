"use client";

import Link from "next/link";
import { Zap, TrendingUp, FileText } from "lucide-react";

export default function MarketingPage() {
  const modules = [
    { title: "Campaigns", icon: Zap, href: "/admin/marketing/campaigns" },
    { title: "Automation", icon: TrendingUp, href: "/admin/marketing/automation" },
    { title: "Email Lists", icon: FileText, href: "/admin/marketing/email-management" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing</h1>
        <p className="text-muted-foreground mt-1">Manage campaigns and automation</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modules.map(m => (
          <Link key={m.href} href={m.href}>
            <div className="card-secondary p-6 cursor-pointer hover:ring-2 hover:ring-red-500/30 transition-all">
              <m.icon className="h-8 w-8 text-red-400 mb-3" />
              <h3 className="text-lg font-semibold">{m.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
