/**
 * Logo Fetcher Utility
 * 
 * Cascading logo fetch with fallbacks:
 * 1. Clearbit Logo API
 * 2. Website scraping (apple-touch-icon, og:image, favicon)
 * 3. Google Favicon API
 */

import * as fs from 'fs';
import * as path from 'path';
import { createId } from '@paralleldrive/cuid2';
import { assertSafeUrl } from '@/lib/security/ssrf-protection';

export interface LogoResult {
  success: boolean;
  logoUrl?: string;      // Local path to saved logo
  source?: 'clearbit' | 'website' | 'google' | 'manual';
  originalUrl?: string;  // Where we fetched it from
  error?: string;
}

/**
 * Fetch logo for a brand domain using cascading fallbacks
 */
export async function fetchBrandLogo(domain: string): Promise<LogoResult> {
  // Normalize domain (remove protocol, www, trailing slash)
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase();

  console.log(`[LogoFetcher] Fetching logo for: ${cleanDomain}`);

  // Try each source in order
  const sources = [
    () => tryCleart(cleanDomain),
    () => tryWebsiteScrape(cleanDomain),
    () => tryGoogleFavicon(cleanDomain),
  ];

  for (const trySource of sources) {
    try {
      const result = await trySource();
      if (result.success) {
        return result;
      }
    } catch (err) {
      console.log(`[LogoFetcher] Source failed:`, err);
    }
  }

  return {
    success: false,
    error: 'All logo sources failed. Manual upload required.',
  };
}

/**
 * Try Clearbit Logo API
 */
async function tryCleart(domain: string): Promise<LogoResult> {
  const url = `https://logo.clearbit.com/${domain}`;
  console.log(`[LogoFetcher] Trying Clearbit: ${url}`);

  const response = await fetch(url, { 
    method: 'HEAD',
    signal: AbortSignal.timeout(5000),
  });
  
  if (!response.ok) {
    return { success: false, error: `Clearbit returned ${response.status}` };
  }

  // Clearbit has the logo, now download it
  const imageResponse = await fetch(url, {
    signal: AbortSignal.timeout(10000),
  });
  
  if (!imageResponse.ok) {
    return { success: false, error: 'Failed to download from Clearbit' };
  }

  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  const savedPath = await saveLogoFile(buffer, domain, 'png');

  return {
    success: true,
    logoUrl: savedPath,
    source: 'clearbit',
    originalUrl: url,
  };
}

/**
 * Try scraping website for logo
 */
async function tryWebsiteScrape(domain: string): Promise<LogoResult> {
  const url = `https://${domain}`;
  assertSafeUrl(url);
  console.log(`[LogoFetcher] Trying website scrape: ${url}`);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ApexBot/1.0)',
    },
  });

  if (!response.ok) {
    return { success: false, error: `Website returned ${response.status}` };
  }

  const html = await response.text();

  // Try to find logo URLs in order of preference
  const logoUrls = [
    // Apple touch icon (usually high quality)
    extractAttr(html, /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i),
    extractAttr(html, /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i),
    // Open Graph image
    extractAttr(html, /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i),
    extractAttr(html, /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i),
    // Shortcut icon / favicon (larger sizes preferred)
    extractAttr(html, /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["'][^>]*sizes=["'](?:192|180|152|144|128|96)[^"']*["']/i),
    extractAttr(html, /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i),
  ].filter(Boolean);

  for (const logoUrl of logoUrls) {
    try {
      const absoluteUrl = new URL(logoUrl!, url).href;
      console.log(`[LogoFetcher] Found potential logo: ${absoluteUrl}`);

      const imgResponse = await fetch(absoluteUrl, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ApexBot/1.0)',
        },
      });

      if (imgResponse.ok) {
        const contentType = imgResponse.headers.get('content-type') || '';
        const ext = contentType.includes('svg') ? 'svg' 
          : contentType.includes('png') ? 'png'
          : contentType.includes('ico') ? 'ico'
          : 'png';

        const buffer = Buffer.from(await imgResponse.arrayBuffer());
        
        // Skip tiny images (likely tracking pixels)
        if (buffer.length < 500) {
          console.log(`[LogoFetcher] Skipping tiny image (${buffer.length} bytes)`);
          continue;
        }

        const savedPath = await saveLogoFile(buffer, domain, ext);

        return {
          success: true,
          logoUrl: savedPath,
          source: 'website',
          originalUrl: absoluteUrl,
        };
      }
    } catch (err) {
      console.log(`[LogoFetcher] Failed to fetch logo URL:`, err);
    }
  }

  return { success: false, error: 'No suitable logo found on website' };
}

/**
 * Try Google Favicon API (last resort)
 */
async function tryGoogleFavicon(domain: string): Promise<LogoResult> {
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  console.log(`[LogoFetcher] Trying Google Favicon: ${url}`);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    return { success: false, error: `Google Favicon returned ${response.status}` };
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  
  // Google returns a default globe icon for unknown domains - skip if too small
  if (buffer.length < 1000) {
    return { success: false, error: 'Google returned default/small icon' };
  }

  const savedPath = await saveLogoFile(buffer, domain, 'png');

  return {
    success: true,
    logoUrl: savedPath,
    source: 'google',
    originalUrl: url,
  };
}

/**
 * Save logo file to uploads directory
 */
async function saveLogoFile(buffer: Buffer, domain: string, ext: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'brand-logos');

  // Ensure directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Sanitize domain: only allow alphanumeric and hyphens
  const safeDomain = domain.replace(/[^a-z0-9.-]/gi, '').replace(/\./g, '-');
  // Whitelist extension
  const safeExt = ['png', 'jpg', 'jpeg', 'ico', 'webp'].includes(ext) ? ext : 'png';
  const filename = `${safeDomain}-${createId()}.${safeExt}`;
  const filePath = path.join(uploadsDir, filename);

  // Verify resolved path stays within uploads directory (prevent path traversal)
  const resolvedPath = path.resolve(filePath);
  const resolvedUploadsDir = path.resolve(uploadsDir);
  if (!resolvedPath.startsWith(resolvedUploadsDir)) {
    throw new Error('Invalid file path: path traversal detected');
  }

  fs.writeFileSync(filePath, buffer);
  console.log(`[LogoFetcher] Saved logo to: ${filePath}`);

  // Return the public URL path
  return `/uploads/brand-logos/${filename}`;
}

/**
 * Helper to extract attribute from HTML
 */
function extractAttr(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? match[1] : null;
}

/**
 * Convert logo to base64 data URL (for PDF embedding)
 */
export async function logoToBase64(logoPath: string): Promise<string | null> {
  try {
    // Handle both local paths and URLs
    if (logoPath.startsWith('/uploads/')) {
      const fullPath = path.join(process.cwd(), 'public', logoPath);
      const buffer = fs.readFileSync(fullPath);
      const ext = path.extname(logoPath).slice(1);
      const mimeType = ext === 'svg' ? 'image/svg+xml' 
        : ext === 'png' ? 'image/png'
        : ext === 'ico' ? 'image/x-icon'
        : 'image/jpeg';
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } else if (logoPath.startsWith('http')) {
      const response = await fetch(logoPath);
      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/png';
      return `data:${contentType};base64,${buffer.toString('base64')}`;
    }
    return null;
  } catch (err) {
    console.error('[LogoFetcher] Failed to convert logo to base64:', err);
    return null;
  }
}
