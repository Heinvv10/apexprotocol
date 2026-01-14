/**
 * Medium Publishing Client
 * Handles content publishing to Medium via their API
 */

// Medium environment configuration
const mediumApiToken = process.env.MEDIUM_API_TOKEN;

/**
 * Check if Medium is configured
 */
export function isMediumConfigured(): boolean {
  return !!mediumApiToken;
}

/**
 * Get Medium configuration with validation
 */
function getMediumConfig(): { apiToken: string } {
  if (!mediumApiToken) {
    throw new Error(
      "Medium API token is not configured. Set MEDIUM_API_TOKEN environment variable."
    );
  }

  return { apiToken: mediumApiToken };
}

// Types for Medium operations
export interface MediumContent {
  title: string;
  body: string;
  contentFormat?: "html" | "markdown";
  tags?: string[];
  publishStatus?: "public" | "draft" | "unlisted";
  canonicalUrl?: string;
}

export interface MediumUser {
  id: string;
  username: string;
  name: string;
  url: string;
  imageUrl: string;
}

export interface MediumPostResponse {
  id: string;
  title: string;
  authorId: string;
  url: string;
  canonicalUrl: string;
  publishStatus: string;
  license: string;
  licenseUrl: string;
  tags: string[];
  publishedAt: number;
}

export interface MediumPublishResult {
  success: boolean;
  postId: string;
  postUrl: string;
  response: MediumPostResponse;
}

export interface MediumError {
  errors: Array<{
    message: string;
    code: number;
  }>;
}

const MEDIUM_API_BASE = "https://api.medium.com/v1";

/**
 * Get the authenticated user's information
 */
export async function getMediumUser(): Promise<MediumUser> {
  const config = getMediumConfig();

  const response = await fetch(`${MEDIUM_API_BASE}/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  const responseData = await response.json();

  if (!response.ok) {
    const error = responseData as MediumError;
    throw new Error(
      `Medium API error (${response.status}): ${error.errors?.[0]?.message || response.statusText}`
    );
  }

  return responseData.data as MediumUser;
}

/**
 * Publish content to Medium
 * Uses Medium API with Bearer token authentication
 *
 * @param content - Content to publish (title, body, and optional settings)
 * @returns Promise<MediumPublishResult> - Result with post ID and URL
 * @throws Error if Medium is not configured or API request fails
 */
export async function publishToMedium(
  content: MediumContent
): Promise<MediumPublishResult> {
  const config = getMediumConfig();

  // Validate required fields
  if (!content.title || content.title.trim() === "") {
    throw new Error("Content title is required");
  }
  if (!content.body || content.body.trim() === "") {
    throw new Error("Content body is required");
  }

  try {
    // First, get the authenticated user to get their ID
    const user = await getMediumUser();

    // Prepare post data according to Medium API schema
    const postData = {
      title: content.title,
      contentFormat: content.contentFormat || "html",
      content: content.body,
      publishStatus: content.publishStatus || "public",
      ...(content.tags && { tags: content.tags.slice(0, 5) }), // Medium allows max 5 tags
      ...(content.canonicalUrl && { canonicalUrl: content.canonicalUrl }),
    };

    const response = await fetch(
      `${MEDIUM_API_BASE}/users/${user.id}/posts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(postData),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      const error = responseData as MediumError;

      // Handle specific error codes
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `Medium authentication failed: ${error.errors?.[0]?.message || "Invalid API token"}. Please verify your Medium Integration Token.`
        );
      }

      throw new Error(
        `Medium API error (${response.status}): ${error.errors?.[0]?.message || response.statusText}`
      );
    }

    const postResponse = responseData.data as MediumPostResponse;

    return {
      success: true,
      postId: postResponse.id,
      postUrl: postResponse.url,
      response: postResponse,
    };
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof Error && error.message.includes("Medium")) {
      throw error;
    }

    // Handle network errors and other fetch failures
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Failed to connect to Medium API. Please check your network connection."
      );
    }

    // Generic error fallback
    throw new Error(
      `Failed to publish to Medium: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Test Medium connection and authentication
 * Useful for validating configuration
 *
 * @returns Promise<boolean> - True if connection is valid
 * @throws Error with details if connection fails
 */
export async function testMediumConnection(): Promise<boolean> {
  try {
    await getMediumUser();
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Medium")) {
      throw error;
    }

    throw new Error(
      `Medium connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
