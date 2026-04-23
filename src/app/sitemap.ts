import type { MetadataRoute } from "next";

const SITE_URL = "https://www.apexgeo.app";

/**
 * Public-facing routes that should be indexable. Kept in sync with the
 * `publicRoutes` list in src/middleware.ts — any page added there that
 * serves marketing/legal/docs content should appear here too.
 *
 * Priority + change-frequency are hints, not promises. They reflect how
 * often the *content* actually moves, not how often a visitor lands on
 * the page.
 */
const routes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/",                changeFrequency: "weekly",  priority: 1.0 },
  { path: "/what-is-apexgeo", changeFrequency: "monthly", priority: 0.9 },
  { path: "/blog",            changeFrequency: "weekly",  priority: 0.8 },
  { path: "/changelog",  changeFrequency: "weekly",  priority: 0.6 },
  { path: "/trust",      changeFrequency: "monthly", priority: 0.7 },
  { path: "/docs/api",   changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact",    changeFrequency: "monthly", priority: 0.6 },
  { path: "/support",    changeFrequency: "monthly", priority: 0.6 },
  { path: "/careers",    changeFrequency: "monthly", priority: 0.5 },
  { path: "/status",     changeFrequency: "daily",   priority: 0.4 },
  { path: "/privacy",    changeFrequency: "yearly",  priority: 0.3 },
  { path: "/terms",      changeFrequency: "yearly",  priority: 0.3 },
  { path: "/cookies",    changeFrequency: "yearly",  priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
