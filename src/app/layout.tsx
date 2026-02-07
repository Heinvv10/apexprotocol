import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@/components/providers/clerk-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider, Toaster } from "@/components/toast";
import { QueryProvider } from "@/components/providers/query-provider";
import { RealtimeProvider } from "@/components/providers/realtime-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1a" },
    { media: "(prefers-color-scheme: light)", color: "#4926FA" },
  ],
};

export const metadata: Metadata = {
  title: "ApexGEO - AI Visibility Platform",
  description: "Track and optimize your brand visibility across AI-powered search engines. Monitor ChatGPT, Claude, Gemini, Perplexity and more.",
  keywords: ["GEO", "AEO", "AI visibility", "brand monitoring", "AI search optimization", "generative engine optimization"],
  manifest: "/manifest.json",
  metadataBase: new URL("https://www.apexgeo.app"),
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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <QueryProvider>
              <RealtimeProvider>
                <ToastProvider>
                  {children}
                  <Toaster />
                </ToastProvider>
              </RealtimeProvider>
            </QueryProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
