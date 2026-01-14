/**
 * PNG Export Generator
 * Export charts and components as PNG images using native browser APIs
 *
 * Uses SVG serialization and Canvas rendering for chart-to-PNG conversion.
 * This approach works in browser context without external dependencies.
 */

// ============================================================================
// Types
// ============================================================================

export interface PNGExportOptions {
  filename?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  scale?: number;
  quality?: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

// ============================================================================
// Core PNG Export Utilities
// ============================================================================

/**
 * Convert SVG element to PNG data URL
 * Uses Canvas API for rendering
 */
export async function svgToPng(
  svgElement: SVGElement,
  options: PNGExportOptions = {}
): Promise<string> {
  const {
    width = svgElement.clientWidth || 800,
    height = svgElement.clientHeight || 400,
    backgroundColor = "#ffffff",
    scale = 2, // Higher scale for better quality
  } = options;

  // Clone SVG to avoid modifying original
  const clonedSvg = svgElement.cloneNode(true) as SVGElement;

  // Set dimensions
  clonedSvg.setAttribute("width", String(width));
  clonedSvg.setAttribute("height", String(height));

  // Serialize SVG to string
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clonedSvg);

  // Add XML declaration and encoding
  if (!svgString.includes("xmlns")) {
    svgString = svgString.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // Create blob and URL
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // Create canvas with scaled dimensions
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(svgUrl);
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Scale and draw image
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);

      // Clean up
      URL.revokeObjectURL(svgUrl);

      // Convert to PNG data URL
      const pngDataUrl = canvas.toDataURL("image/png");
      resolve(pngDataUrl);
    };

    img.onerror = (error) => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error(`Failed to load SVG image: ${error}`));
    };

    img.src = svgUrl;
  });
}

/**
 * Convert HTML element to PNG data URL
 * Uses html-to-canvas approach via foreign object
 */
export async function elementToPng(
  element: HTMLElement,
  options: PNGExportOptions = {}
): Promise<string> {
  const {
    width = element.offsetWidth || 800,
    height = element.offsetHeight || 400,
    backgroundColor = "#ffffff",
    scale = 2,
  } = options;

  // Check if element contains SVG (Recharts case)
  const svgElement = element.querySelector("svg");
  if (svgElement) {
    return svgToPng(svgElement, { width, height, backgroundColor, scale });
  }

  // For non-SVG elements, use foreignObject approach
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Clone element and get its HTML
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;

  // Create SVG with foreignObject
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${clone.outerHTML}
        </div>
      </foreignObject>
    </svg>
  `;

  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(svgUrl);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error("Failed to convert element to PNG"));
    };

    img.src = svgUrl;
  });
}

/**
 * Convert data URL to Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Download PNG from data URL
 */
export function downloadPng(dataUrl: string, filename: string = "chart.png"): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================================
// Chart-Specific PNG Generation
// ============================================================================

/**
 * Generate a simple line chart as PNG
 * Pure canvas implementation for server-side rendering
 */
export function generateLineChartPng(
  data: Array<{ label: string; value: number }>,
  options: PNGExportOptions = {}
): string {
  const {
    width = 800,
    height = 400,
    backgroundColor = "#ffffff",
  } = options;

  // For server-side, we return a placeholder SVG data URL
  // This will be replaced with actual canvas rendering in browser context
  if (typeof window === "undefined") {
    return generateSvgChartDataUrl(data, { width, height, backgroundColor });
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Chart area
  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Find data range
  const values = data.map(d => d.value);
  const maxValue = Math.max(...values, 100);
  const minValue = Math.min(...values, 0);

  // Draw axes
  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  // Draw grid lines
  ctx.strokeStyle = "#e5e7eb";
  ctx.setLineDash([5, 5]);
  for (let i = 0; i <= 4; i++) {
    const y = padding + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Draw data line
  if (data.length > 0) {
    ctx.strokeStyle = "#00E5CC";
    ctx.lineWidth = 3;
    ctx.beginPath();

    data.forEach((point, i) => {
      const x = padding + (chartWidth / (data.length - 1 || 1)) * i;
      const y = height - padding - ((point.value - minValue) / (maxValue - minValue || 1)) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw data points
    ctx.fillStyle = "#00E5CC";
    data.forEach((point, i) => {
      const x = padding + (chartWidth / (data.length - 1 || 1)) * i;
      const y = height - padding - ((point.value - minValue) / (maxValue - minValue || 1)) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Draw labels
  ctx.fillStyle = "#6b7280";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";

  data.forEach((point, i) => {
    const x = padding + (chartWidth / (data.length - 1 || 1)) * i;
    ctx.fillText(point.label, x, height - padding + 20);
  });

  // Y-axis labels
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const value = maxValue - (maxValue - minValue) * (i / 4);
    const y = padding + (chartHeight / 4) * i;
    ctx.fillText(value.toFixed(0), padding - 10, y + 4);
  }

  return canvas.toDataURL("image/png");
}

/**
 * Generate SVG chart data URL (server-safe)
 */
function generateSvgChartDataUrl(
  data: Array<{ label: string; value: number }>,
  options: { width: number; height: number; backgroundColor: string }
): string {
  const { width, height, backgroundColor } = options;
  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const values = data.map(d => d.value);
  const maxValue = Math.max(...values, 100);
  const minValue = Math.min(...values, 0);

  // Build SVG path
  let pathD = "";
  data.forEach((point, i) => {
    const x = padding + (chartWidth / (data.length - 1 || 1)) * i;
    const y = height - padding - ((point.value - minValue) / (maxValue - minValue || 1)) * chartHeight;
    pathD += `${i === 0 ? "M" : "L"} ${x} ${y} `;
  });

  // Build points
  const circles = data.map((point, i) => {
    const x = padding + (chartWidth / (data.length - 1 || 1)) * i;
    const y = height - padding - ((point.value - minValue) / (maxValue - minValue || 1)) * chartHeight;
    return `<circle cx="${x}" cy="${y}" r="5" fill="#00E5CC"/>`;
  }).join("\n");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#d1d5db"/>
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#d1d5db"/>
      <path d="${pathD}" fill="none" stroke="#00E5CC" stroke-width="3"/>
      ${circles}
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generate bar chart as PNG
 */
export function generateBarChartPng(
  data: ChartDataPoint[],
  options: PNGExportOptions = {}
): string {
  const {
    width = 800,
    height = 400,
    backgroundColor = "#ffffff",
  } = options;

  // For server-side, return SVG
  if (typeof window === "undefined") {
    return generateSvgBarChartDataUrl(data, { width, height, backgroundColor });
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Chart area
  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Find max value
  const maxValue = Math.max(...data.map(d => d.value), 100);

  // Draw axes
  ctx.strokeStyle = "#d1d5db";
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  // Draw bars
  const barWidth = chartWidth / data.length * 0.7;
  const gap = chartWidth / data.length * 0.3;

  data.forEach((point, i) => {
    const barHeight = (point.value / maxValue) * chartHeight;
    const x = padding + (chartWidth / data.length) * i + gap / 2;
    const y = height - padding - barHeight;

    ctx.fillStyle = point.color || "#00E5CC";
    ctx.fillRect(x, y, barWidth, barHeight);

    // Label
    ctx.fillStyle = "#6b7280";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(point.label, x + barWidth / 2, height - padding + 20);
  });

  return canvas.toDataURL("image/png");
}

/**
 * Generate SVG bar chart data URL (server-safe)
 */
function generateSvgBarChartDataUrl(
  data: ChartDataPoint[],
  options: { width: number; height: number; backgroundColor: string }
): string {
  const { width, height, backgroundColor } = options;
  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxValue = Math.max(...data.map(d => d.value), 100);
  const barWidth = chartWidth / data.length * 0.7;
  const gap = chartWidth / data.length * 0.3;

  const bars = data.map((point, i) => {
    const barHeight = (point.value / maxValue) * chartHeight;
    const x = padding + (chartWidth / data.length) * i + gap / 2;
    const y = height - padding - barHeight;
    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${point.color || "#00E5CC"}"/>`;
  }).join("\n");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#d1d5db"/>
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#d1d5db"/>
      ${bars}
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Create PNG response for API endpoints
 */
export function createPNGResponse(dataUrl: string, filename: string = "chart.png"): Response {
  const blob = dataUrlToBlob(dataUrl);

  return new Response(blob, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": blob.size.toString(),
    },
  });
}

/**
 * Create base64 PNG string for embedding
 */
export function pngToBase64(dataUrl: string): string {
  // Remove the data URL prefix to get just the base64 string
  return dataUrl.replace(/^data:image\/png;base64,/, "");
}
