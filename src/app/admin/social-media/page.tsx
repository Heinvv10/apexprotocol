"use client";

import Link from "next/link";
import { Share2, Zap, BarChart3 } from "lucide-react";

export default function SocialMediaPage() {
  const modules = [
    { title: "Channels", icon: Share2, href: "/admin/social-media/channels" },
    { title: "Posting", icon: Zap, href: "/admin/social-media/posting" },
    { title: "Analytics", icon: BarChart3, href: "/admin/social-media/analytics" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Social Media</h1>
        <p className="text-muted-foreground mt-1">Manage social channels and content</p>
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
