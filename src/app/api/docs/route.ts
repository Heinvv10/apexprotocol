/**
 * API Documentation Route (F141)
 * Serves OpenAPI spec and Swagger UI
 *
 * GET /api/docs - Swagger UI documentation page
 * GET /api/docs?format=json - OpenAPI spec as JSON
 * GET /api/docs?format=yaml - OpenAPI spec as YAML
 */

import { NextRequest, NextResponse } from "next/server";
import { openApiSpec, getOpenApiJson } from "@/lib/api/openapi-spec";

// Swagger UI HTML template
const getSwaggerHtml = (specUrl: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Apex GEO/AEO API Documentation" />
  <title>Apex API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background: #0a0a0b;
    }
    .swagger-ui {
      max-width: 1400px;
      margin: 0 auto;
    }
    .swagger-ui .topbar {
      display: none;
    }
    .swagger-ui .info {
      margin: 50px 0;
    }
    .swagger-ui .info .title {
      color: #fff;
      font-size: 36px;
    }
    .swagger-ui .info .description {
      color: #a0a0a0;
    }
    .swagger-ui .info .description p {
      color: #a0a0a0;
    }
    .swagger-ui .info .description h1,
    .swagger-ui .info .description h2 {
      color: #fff;
      border-bottom: 1px solid #27272a;
      padding-bottom: 10px;
      margin-top: 30px;
    }
    .swagger-ui .info .description code {
      background: #18181b;
      color: #4926fa;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .swagger-ui .info .description pre {
      background: #18181b;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
    }
    .swagger-ui .info .description table {
      border-collapse: collapse;
      margin: 15px 0;
    }
    .swagger-ui .info .description th,
    .swagger-ui .info .description td {
      border: 1px solid #27272a;
      padding: 10px 15px;
      text-align: left;
    }
    .swagger-ui .info .description th {
      background: #18181b;
      color: #fff;
    }
    .swagger-ui .scheme-container {
      background: #18181b;
      box-shadow: none;
    }
    .swagger-ui .opblock-tag {
      color: #fff;
      border-bottom: 1px solid #27272a;
    }
    .swagger-ui .opblock {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      margin: 10px 0;
    }
    .swagger-ui .opblock .opblock-summary {
      border-bottom: 1px solid #27272a;
    }
    .swagger-ui .opblock .opblock-summary-method {
      border-radius: 4px;
      font-weight: 600;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: #17ca29;
    }
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: #4926fa;
    }
    .swagger-ui .opblock.opblock-put .opblock-summary-method {
      background: #ffb020;
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method {
      background: #d4292a;
    }
    .swagger-ui .opblock .opblock-summary-path {
      color: #fff;
    }
    .swagger-ui .opblock .opblock-summary-description {
      color: #a0a0a0;
    }
    .swagger-ui .opblock-body {
      background: #0f0f10;
    }
    .swagger-ui .opblock-description-wrapper p {
      color: #a0a0a0;
    }
    .swagger-ui .parameters-col_name {
      color: #fff;
    }
    .swagger-ui .parameters-col_description {
      color: #a0a0a0;
    }
    .swagger-ui .parameter__name {
      color: #4926fa;
    }
    .swagger-ui .parameter__type {
      color: #17ca29;
    }
    .swagger-ui table tbody tr td {
      border-bottom: 1px solid #27272a;
    }
    .swagger-ui .btn {
      border-radius: 4px;
    }
    .swagger-ui .btn.execute {
      background: #4926fa;
      border-color: #4926fa;
    }
    .swagger-ui .btn.execute:hover {
      background: #3a1fd4;
    }
    .swagger-ui .responses-inner h4,
    .swagger-ui .responses-inner h5 {
      color: #fff;
    }
    .swagger-ui .response-col_status {
      color: #17ca29;
    }
    .swagger-ui .response-col_description {
      color: #a0a0a0;
    }
    .swagger-ui .model-box {
      background: #18181b;
    }
    .swagger-ui .model {
      color: #a0a0a0;
    }
    .swagger-ui .model .property-row {
      color: #a0a0a0;
    }
    .swagger-ui section.models {
      border: 1px solid #27272a;
      border-radius: 8px;
    }
    .swagger-ui section.models h4 {
      color: #fff;
    }
    .swagger-ui .model-title {
      color: #4926fa;
    }
    .swagger-ui select {
      background: #18181b;
      color: #fff;
      border: 1px solid #27272a;
    }
    .swagger-ui input[type=text] {
      background: #18181b;
      color: #fff;
      border: 1px solid #27272a;
    }
    .swagger-ui textarea {
      background: #18181b;
      color: #fff;
      border: 1px solid #27272a;
    }
    .swagger-ui .highlight-code {
      background: #18181b;
    }
    .swagger-ui .microlight {
      background: #18181b;
      color: #a0a0a0;
    }
    .swagger-ui .authorization__btn {
      border-color: #4926fa;
    }
    .swagger-ui .authorization__btn svg {
      fill: #4926fa;
    }
    .swagger-ui .auth-wrapper {
      background: #18181b;
    }
    .swagger-ui .dialog-ux .modal-ux {
      background: #18181b;
      border: 1px solid #27272a;
    }
    .swagger-ui .dialog-ux .modal-ux-header h3 {
      color: #fff;
    }
    .swagger-ui .dialog-ux .modal-ux-content p {
      color: #a0a0a0;
    }
    /* Custom header */
    .api-header {
      background: linear-gradient(135deg, #4926fa 0%, #273adb 100%);
      padding: 40px 20px;
      text-align: center;
      margin-bottom: 0;
    }
    .api-header h1 {
      color: #fff;
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 10px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .api-header p {
      color: rgba(255,255,255,0.8);
      font-size: 16px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .api-header .badges {
      margin-top: 15px;
    }
    .api-header .badge {
      display: inline-block;
      padding: 5px 12px;
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      color: #fff;
      font-size: 12px;
      margin: 0 5px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
  </style>
</head>
<body>
  <div class="api-header">
    <h1>Apex API Documentation</h1>
    <p>RESTful API for GEO/AEO brand monitoring and optimization</p>
    <div class="badges">
      <span class="badge">v1.0.0</span>
      <span class="badge">OpenAPI 3.1</span>
      <span class="badge">REST</span>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '${specUrl}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        persistAuthorization: true,
      });
    };
  </script>
</body>
</html>
`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  // Return OpenAPI spec as JSON
  if (format === "json") {
    return NextResponse.json(openApiSpec, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": "inline; filename=openapi.json",
      },
    });
  }

  // Return OpenAPI spec as YAML (simplified)
  if (format === "yaml") {
    const yaml = getOpenApiJson(); // For simplicity, return JSON
    return new NextResponse(yaml, {
      headers: {
        "Content-Type": "application/x-yaml",
        "Content-Disposition": "inline; filename=openapi.yaml",
      },
    });
  }

  // Return Swagger UI HTML
  const baseUrl = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const specUrl = `${protocol}://${baseUrl}/api/docs?format=json`;

  return new NextResponse(getSwaggerHtml(specUrl), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
