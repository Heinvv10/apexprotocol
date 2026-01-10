/**
 * WordPress Publishing Client
 * Handles content publishing to WordPress sites via REST API
 */

// WordPress environment configuration
const wordpressUrl = process.env.WORDPRESS_URL;
const wordpressUsername = process.env.WORDPRESS_USERNAME;
const wordpressAppPassword = process.env.WORDPRESS_APP_PASSWORD;

/**
 * Check if WordPress is configured
 */
export function isWordPressConfigured(): boolean {
  return !!(wordpressUrl && wordpressUsername && wordpressAppPassword);
}

/**
 * Get WordPress configuration with validation
 */
function getWordPressConfig(): {
  url: string;
  username: string;
  appPassword: string;
} {
  if (!wordpressUrl) {
    throw new Error(
      "WordPress URL is not configured. Set WORDPRESS_URL environment variable."
    );
  }
  if (!wordpressUsername) {
    throw new Error(
      "WordPress username is not configured. Set WORDPRESS_USERNAME environment variable."
    );
  }
  if (!wordpressAppPassword) {
    throw new Error(
      "WordPress Application Password is not configured. Set WORDPRESS_APP_PASSWORD environment variable."
    );
  }

  return {
    url: wordpressUrl,
    username: wordpressUsername,
    appPassword: wordpressAppPassword,
  };
}

// Types for WordPress operations
export interface WordPressContent {
  title: string;
  body: string;
  excerpt?: string;
  status?: "publish" | "draft" | "pending" | "private";
  categories?: number[];
  tags?: number[];
  featuredMedia?: number;
  meta?: Record<string, unknown>;
}

export interface WordPressPostResponse {
  id: number;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  status: string;
  date: string;
  modified: string;
  author: number;
  [key: string]: unknown;
}

export interface WordPressPublishResult {
  success: boolean;
  postId: number;
  postUrl: string;
  response: WordPressPostResponse;
}

export interface WordPressError {
  code: string;
  message: string;
  data?: {
    status: number;
    [key: string]: unknown;
  };
}

/**
 * Generate Basic Auth header for WordPress API
 */
function getAuthHeader(username: string, appPassword: string): string {
  const credentials = `${username}:${appPassword}`;
  const base64Credentials = Buffer.from(credentials).toString("base64");
  return `Basic ${base64Credentials}`;
}

/**
 * Publish content to WordPress
 * Uses WordPress REST API v2 with Application Password authentication
 *
 * @param content - Content to publish (title, body, and optional settings)
 * @returns Promise<WordPressPublishResult> - Result with post ID and URL
 * @throws Error if WordPress is not configured or API request fails
 */
export async function publishToWordPress(
  content: WordPressContent
): Promise<WordPressPublishResult> {
  const config = getWordPressConfig();

  // Validate required fields
  if (!content.title || content.title.trim() === "") {
    throw new Error("Content title is required");
  }
  if (!content.body || content.body.trim() === "") {
    throw new Error("Content body is required");
  }

  const authHeader = getAuthHeader(config.username, config.appPassword);
  const apiUrl = `${config.url}/wp-json/wp/v2/posts`;

  // Prepare post data according to WordPress REST API schema
  const postData = {
    title: content.title,
    content: content.body,
    status: content.status || "publish",
    ...(content.excerpt && { excerpt: content.excerpt }),
    ...(content.categories && { categories: content.categories }),
    ...(content.tags && { tags: content.tags }),
    ...(content.featuredMedia && { featured_media: content.featuredMedia }),
    ...(content.meta && { meta: content.meta }),
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    // Parse response body
    const responseData = await response.json();

    // Handle errors
    if (!response.ok) {
      const error = responseData as WordPressError;

      // Special handling for authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `WordPress authentication failed: ${error.message}. Please verify your WordPress Application Password is correct and has sufficient permissions.`
        );
      }

      // Handle other WordPress API errors
      throw new Error(
        `WordPress API error (${response.status}): ${error.message || response.statusText}`
      );
    }

    // Type assertion after successful response
    const postResponse = responseData as WordPressPostResponse;

    return {
      success: true,
      postId: postResponse.id,
      postUrl: postResponse.link,
      response: postResponse,
    };
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof Error && error.message.includes("WordPress")) {
      throw error;
    }

    // Handle network errors and other fetch failures
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Failed to connect to WordPress at ${config.url}. Please verify the URL is correct and accessible.`
      );
    }

    // Generic error fallback
    throw new Error(
      `Failed to publish to WordPress: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Update an existing WordPress post
 *
 * @param postId - WordPress post ID to update
 * @param content - Updated content
 * @returns Promise<WordPressPublishResult> - Result with updated post data
 * @throws Error if WordPress is not configured or API request fails
 */
export async function updateWordPressPost(
  postId: number,
  content: Partial<WordPressContent>
): Promise<WordPressPublishResult> {
  const config = getWordPressConfig();

  const authHeader = getAuthHeader(config.username, config.appPassword);
  const apiUrl = `${config.url}/wp-json/wp/v2/posts/${postId}`;

  // Prepare update data
  const updateData: Record<string, unknown> = {};
  if (content.title) updateData.title = content.title;
  if (content.body) updateData.content = content.body;
  if (content.status) updateData.status = content.status;
  if (content.excerpt) updateData.excerpt = content.excerpt;
  if (content.categories) updateData.categories = content.categories;
  if (content.tags) updateData.tags = content.tags;
  if (content.featuredMedia) updateData.featured_media = content.featuredMedia;
  if (content.meta) updateData.meta = content.meta;

  try {
    const response = await fetch(apiUrl, {
      method: "POST", // WordPress REST API uses POST for updates
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const error = responseData as WordPressError;

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `WordPress authentication failed: ${error.message}. Please verify your WordPress Application Password.`
        );
      }

      if (response.status === 404) {
        throw new Error(`WordPress post ${postId} not found`);
      }

      throw new Error(
        `WordPress API error (${response.status}): ${error.message || response.statusText}`
      );
    }

    const postResponse = responseData as WordPressPostResponse;

    return {
      success: true,
      postId: postResponse.id,
      postUrl: postResponse.link,
      response: postResponse,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("WordPress")) {
      throw error;
    }

    throw new Error(
      `Failed to update WordPress post: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Delete a WordPress post
 *
 * @param postId - WordPress post ID to delete
 * @param force - If true, permanently delete. If false, move to trash.
 * @returns Promise<boolean> - True if deletion was successful
 * @throws Error if WordPress is not configured or API request fails
 */
export async function deleteWordPressPost(
  postId: number,
  force = false
): Promise<boolean> {
  const config = getWordPressConfig();

  const authHeader = getAuthHeader(config.username, config.appPassword);
  const apiUrl = `${config.url}/wp-json/wp/v2/posts/${postId}?force=${force}`;

  try {
    const response = await fetch(apiUrl, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      const error = responseData as WordPressError;

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `WordPress authentication failed: ${error.message}. Please verify your WordPress Application Password.`
        );
      }

      if (response.status === 404) {
        throw new Error(`WordPress post ${postId} not found`);
      }

      throw new Error(
        `WordPress API error (${response.status}): ${error.message || response.statusText}`
      );
    }

    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("WordPress")) {
      throw error;
    }

    throw new Error(
      `Failed to delete WordPress post: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get a WordPress post by ID
 *
 * @param postId - WordPress post ID
 * @returns Promise<WordPressPostResponse> - WordPress post data
 * @throws Error if WordPress is not configured or API request fails
 */
export async function getWordPressPost(
  postId: number
): Promise<WordPressPostResponse> {
  const config = getWordPressConfig();

  const authHeader = getAuthHeader(config.username, config.appPassword);
  const apiUrl = `${config.url}/wp-json/wp/v2/posts/${postId}`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      const error = responseData as WordPressError;

      if (response.status === 404) {
        throw new Error(`WordPress post ${postId} not found`);
      }

      throw new Error(
        `WordPress API error (${response.status}): ${error.message || response.statusText}`
      );
    }

    return responseData as WordPressPostResponse;
  } catch (error) {
    if (error instanceof Error && error.message.includes("WordPress")) {
      throw error;
    }

    throw new Error(
      `Failed to get WordPress post: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Test WordPress connection and authentication
 * Useful for validating configuration
 *
 * @returns Promise<boolean> - True if connection is valid
 * @throws Error with details if connection fails
 */
export async function testWordPressConnection(): Promise<boolean> {
  const config = getWordPressConfig();

  const authHeader = getAuthHeader(config.username, config.appPassword);
  const apiUrl = `${config.url}/wp-json/wp/v2/users/me`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const responseData = await response.json();
      const error = responseData as WordPressError;

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `WordPress authentication failed: ${error.message}. Please verify your WordPress Application Password is correct.`
        );
      }

      throw new Error(
        `WordPress connection test failed (${response.status}): ${error.message || response.statusText}`
      );
    }

    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("WordPress")) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Failed to connect to WordPress at ${config.url}. Please verify the URL is correct and accessible.`
      );
    }

    throw new Error(
      `WordPress connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
