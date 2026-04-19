"use client";

import { useEffect } from "react";

const SWAGGER_VERSION = "5.17.14";

declare global {
  interface Window {
    SwaggerUIBundle?: (config: Record<string, unknown>) => unknown;
    ui?: unknown;
  }
}

export function SwaggerUIClient({ specUrl }: { specUrl: string }) {
  useEffect(() => {
    // Inject CSS once
    if (!document.getElementById("swagger-ui-css")) {
      const link = document.createElement("link");
      link.id = "swagger-ui-css";
      link.rel = "stylesheet";
      link.href = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css`;
      document.head.appendChild(link);
    }

    // Inject bundle once
    const scriptId = "swagger-ui-bundle";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const init = () => {
      if (!window.SwaggerUIBundle) return;
      window.ui = window.SwaggerUIBundle({
        url: specUrl,
        dom_id: "#swagger-ui",
        deepLinking: true,
        displayRequestDuration: true,
        persistAuthorization: true,
        tryItOutEnabled: true,
        filter: true,
      });
    };

    if (script) {
      init();
    } else {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js`;
      script.crossOrigin = "anonymous";
      script.onload = init;
      document.body.appendChild(script);
    }
  }, [specUrl]);

  return <div id="swagger-ui" />;
}
