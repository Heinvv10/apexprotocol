"use client";

import Link from "next/link";

const footerLinks = {
  platform: [
    { label: "Features", href: "#platform" },
    { label: "Pricing", href: "#pricing" },
    { label: "Integrations", href: "#integrations" },
    { label: "Changelog", href: "/changelog" },
  ],
  company: [
    { label: "About", href: "#company" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  resources: [
    { label: "Documentation", href: "#resources" },
    { label: "API Reference", href: "/docs/api" },
    { label: "Status", href: "/status" },
    { label: "Support", href: "/support" },
  ],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Cookies", href: "/cookies" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="relative w-8 h-8">
                {/* Triangular prism SVG */}
                <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
                  <path
                    d="M16 2L28 26H4L16 2Z"
                    fill="url(#footerPrismGradient)"
                  />
                  <path
                    d="M16 2L28 26H16V2Z"
                    fill="url(#footerPrismHighlight)"
                    opacity="0.6"
                  />
                  <path
                    d="M16 2L4 26H16V2Z"
                    fill="hsl(var(--primary))"
                    opacity="0.8"
                  />
                  <defs>
                    <linearGradient id="footerPrismGradient" x1="4" y1="26" x2="28" y2="2">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--accent-blue))" />
                    </linearGradient>
                    <linearGradient id="footerPrismHighlight" x1="16" y1="2" x2="28" y2="26">
                      <stop offset="0%" stopColor="hsl(var(--accent-purple))" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="font-semibold text-lg tracking-tight">Apex</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              AI Visibility Platform for modern brands.
            </p>
            <div className="flex gap-3">
              <SocialLink href="https://twitter.com" label="Twitter" />
              <SocialLink href="https://linkedin.com" label="LinkedIn" />
              <SocialLink href="https://github.com" label="GitHub" />
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Platform</h4>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Apex. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>🇿🇦 Built for Africa</span>
            <span>•</span>
            <span>🌍 Available Worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label={label}
    >
      <span className="text-xs font-bold">{label.charAt(0)}</span>
    </a>
  );
}
