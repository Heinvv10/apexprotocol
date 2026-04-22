import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SupabaseAuthSync } from "@/components/providers/supabase-auth-sync";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider, Toaster } from "@/components/toast";
import { QueryProvider } from "@/components/providers/query-provider";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { ServiceWorkerRegister } from "@/components/providers/sw-register";
import { InstallPrompt } from "@/components/providers/install-prompt";
import { Toaster as SonnerToaster } from "sonner";
import { getActiveBrand } from "@/config/brand-presets";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// iOS apple-touch-startup-image links can't be expressed via Next's metadata
// API because it doesn't support the per-device `media` query syntax iOS needs
// to pick the right splash. Emit raw <link> tags in the layout <head> instead.
const IOS_SPLASHES: Array<{ w: number; h: number; media: string }> = [
  { w: 640,  h: 1136, media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" },
  { w: 750,  h: 1334, media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" },
  { w: 828,  h: 1792, media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" },
  { w: 1125, h: 2436, media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" },
  { w: 1242, h: 2208, media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" },
  { w: 1242, h: 2688, media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" },
  { w: 1170, h: 2532, media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" },
  { w: 1284, h: 2778, media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" },
  { w: 1179, h: 2556, media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" },
  { w: 1290, h: 2796, media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" },
  { w: 1536, h: 2048, media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" },
  { w: 1668, h: 2224, media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)" },
  { w: 1668, h: 2388, media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" },
  { w: 2048, h: 2732, media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" },
];

export const viewport: Viewport = {
  themeColor: [
    // Must be a concrete color — `hsl(var(--...))` doesn't resolve in the
    // meta tag and iOS/Android then fall back to white on install.
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1a" },
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const _brand = getActiveBrand();

export const metadata: Metadata = {
  title: {
    default: `${_brand.name} — AI Visibility Platform`,
    template: `%s | ${_brand.name}`,
  },
  description: _brand.tagline,
  keywords: ["GEO", "AEO", "AI visibility", "brand monitoring", "AI search optimization", "generative engine optimization"],
  manifest: "/manifest.json",
  metadataBase: new URL("https://www.apexgeo.app"),
  alternates: {
    canonical: "/",
  },
  icons: { icon: _brand.faviconUrl },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.apexgeo.app",
    siteName: "ApexGEO",
    title: "ApexGEO - AI Visibility Platform",
    description: "Track and optimize your brand visibility across AI-powered search engines. Be the answer, not just a result.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ApexGEO - AI Visibility Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ApexGEO - AI Visibility Platform",
    description: "Track and optimize your brand visibility across AI-powered search engines.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ApexGEO",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brand = getActiveBrand();
  return (
    <html lang="en" className="dark" suppressHydrationWarning data-brand={brand.name.toLowerCase()}>
      <head>
        {IOS_SPLASHES.map((s) => (
          <link
            key={`${s.w}x${s.h}`}
            rel="apple-touch-startup-image"
            href={`/splash/apple-splash-${s.w}x${s.h}.png`}
            media={s.media}
          />
        ))}
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            <RealtimeProvider>
              <ToastProvider>
                <SupabaseAuthSync />
                <ServiceWorkerRegister />
                <InstallPrompt />
                {children}
                <Toaster />
                <SonnerToaster
                  position="bottom-right"
                  theme="dark"
                  closeButton
                  richColors
                />
              </ToastProvider>
            </RealtimeProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
