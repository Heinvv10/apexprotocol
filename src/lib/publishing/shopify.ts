import { logger } from "@/lib/logger";
/**
 * Shopify direct-publish (FR-CRE-017).
 *
 * Publishes a content draft as a blog article to the client's Shopify store.
 * AthenaHQ's SKU-level moat was built on this; we match it.
 *
 * Auth model: Shopify Custom App with Admin API access token stored
 * per-brand (encrypted via the same api-key-encryption helper we use for
 * integrations). Required scopes: write_content, read_content.
 *
 * Caller flow:
 *   1. Client connects Shopify via /api/integrations/shopify (stores token)
 *   2. Content-editor's "Publish" button hits /api/brands/:id/publish/shopify
 *   3. This module turns (title, markdownBody, blogHandle?) into a blog article
 */


export interface ShopifyCredentials {
  shopDomain: string; // e.g. "mystore.myshopify.com"
  accessToken: string;
  apiVersion?: string; // default "2025-01"
}

export interface ShopifyArticleInput {
  blogId: string;
  title: string;
  /** HTML — caller is expected to convert markdown up-stream */
  bodyHtml: string;
  author?: string;
  tags?: string[];
  summary?: string;
  published?: boolean;
}

export interface ShopifyBlog {
  id: string;
  title: string;
  handle: string;
}

export interface ShopifyArticle {
  id: string;
  blog_id: string;
  title: string;
  body_html: string;
  handle: string;
  published_at: string | null;
  url: string;
}

export class ShopifyError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ShopifyError";
  }
}

export class ShopifyPublisher {
  private headers: Record<string, string>;
  private base: string;

  constructor(private creds: ShopifyCredentials) {
    if (!creds.shopDomain || !creds.accessToken) {
      throw new Error("shopDomain and accessToken required");
    }
    const version = creds.apiVersion ?? "2025-01";
    this.base = `https://${creds.shopDomain}/admin/api/${version}`;
    this.headers = {
      "X-Shopify-Access-Token": creds.accessToken,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async listBlogs(): Promise<ShopifyBlog[]> {
    const res = await fetch(`${this.base}/blogs.json`, {
      headers: this.headers,
    });
    if (!res.ok) {
      throw new ShopifyError(
        `listBlogs failed: ${res.status}`,
        res.status,
        await res.text().catch(() => null),
      );
    }
    const data = (await res.json()) as { blogs: ShopifyBlog[] };
    return data.blogs;
  }

  async publishArticle(
    input: ShopifyArticleInput,
  ): Promise<ShopifyArticle> {
    const payload = {
      article: {
        title: input.title,
        body_html: input.bodyHtml,
        author: input.author ?? "Apex",
        tags: input.tags?.join(", "),
        summary_html: input.summary,
        published: input.published ?? true,
      },
    };

    const res = await fetch(
      `${this.base}/blogs/${input.blogId}/articles.json`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.warn("shopify.publish_failed", {
        status: res.status,
        blogId: input.blogId,
        title: input.title,
        err: body.slice(0, 400),
      });
      throw new ShopifyError(
        `publishArticle failed: ${res.status}`,
        res.status,
        body,
      );
    }

    const data = (await res.json()) as {
      article: ShopifyArticle & { blog_id: number };
    };

    return {
      ...data.article,
      blog_id: String(data.article.blog_id),
      url: `https://${this.creds.shopDomain}/blogs/${data.article.blog_id}/${data.article.handle}`,
    };
  }
}
