import type { Metadata } from "next";
import { SwaggerUIClient } from "./swagger-ui-client";

export const metadata: Metadata = {
  title: "Apex API — Documentation",
  description: "Interactive documentation for the Apex Public REST API v1.",
  robots: { index: false, follow: false },
};

export default function ApiDocsPage() {
  return (
    <main style={{ margin: 0, padding: 0 }}>
      <SwaggerUIClient specUrl="/api/v1/openapi.json" />
    </main>
  );
}
