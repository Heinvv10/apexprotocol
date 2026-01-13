import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Jira Integration API (F117-F119)
 * GET /api/integrations/jira - Get connection status, projects
 * POST /api/integrations/jira - OAuth flow, create issues, webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  jiraManager,
  formatJiraConnectionResponse,
} from "@/lib/integrations/jira";

// Request schemas
const createIssueSchema = z.object({
  projectId: z.string().min(1),
  summary: z.string().min(1),
  description: z.string(),
  issueType: z.string().optional(),
  priority: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

const createFromRecommendationSchema = z.object({
  recommendationId: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  priority: z.string(),
  category: z.string(),
});

const webhookEventSchema = z.object({
  webhookEvent: z.string(),
  issue: z.record(z.string(), z.unknown()),
  changelog: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const action = searchParams.get("action") || "status";

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "status":
        return handleGetStatus(brandId);

      case "projects":
        return handleGetProjects(brandId);

      case "authUrl": {
        const state = searchParams.get("state") || crypto.randomUUID();
        return handleGetAuthUrl(brandId, state);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: status, projects, authUrl" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process Jira request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action;

    switch (action) {
      case "callback":
        return handleOAuthCallback(body);

      case "selectProject":
        return handleSelectProject(body);

      case "createIssue":
        return handleCreateIssue(body);

      case "createFromRecommendation":
        return handleCreateFromRecommendation(body);

      case "registerWebhook":
        return handleRegisterWebhook(body);

      case "processWebhook":
        return handleProcessWebhook(body);

      case "disconnect":
        return handleDisconnect(body);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: callback, selectProject, createIssue, createFromRecommendation, registerWebhook, processWebhook, disconnect" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Jira operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET handlers
function handleGetStatus(brandId: string) {
  const connection = jiraManager.getConnection(brandId);

  if (!connection) {
    return NextResponse.json({
      success: true,
      connected: false,
      connection: null,
    });
  }

  return NextResponse.json({
    success: true,
    connected: true,
    connection: formatJiraConnectionResponse(connection),
  });
}

async function handleGetProjects(brandId: string) {
  const projects = await jiraManager.getProjects(brandId);

  return NextResponse.json({
    success: true,
    projects,
  });
}

function handleGetAuthUrl(brandId: string, state: string) {
  const authUrl = jiraManager.getAuthorizationUrl(brandId, state);

  return NextResponse.json({
    success: true,
    authUrl,
    state,
  });
}

// POST handlers
async function handleOAuthCallback(body: unknown) {
  const schema = z.object({
    code: z.string().min(1),
    state: z.string().min(1),
  });

  const { code, state } = schema.parse(body);
  const [brandId] = state.split(":");

  if (!brandId) {
    return NextResponse.json(
      { error: "Invalid state parameter" },
      { status: 400 }
    );
  }

  // Exchange code for tokens
  const tokens = await jiraManager.exchangeCodeForTokens(code);

  // Create connection
  const connection = await jiraManager.createConnection(
    brandId,
    tokens.accessToken,
    tokens.refreshToken,
    tokens.expiresIn,
    tokens.scope.split(" ")
  );

  return NextResponse.json({
    success: true,
    message: "Jira connected successfully",
    connection: formatJiraConnectionResponse(connection),
  });
}

async function handleSelectProject(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    projectId: z.string().min(1),
    projectKey: z.string().min(1),
  });

  const { brandId, projectId, projectKey } = schema.parse(body);

  const connection = jiraManager.selectProject(brandId, projectId, projectKey);

  if (!connection) {
    return NextResponse.json(
      { error: "No Jira connection found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Project selected",
    connection: formatJiraConnectionResponse(connection),
  });
}

async function handleCreateIssue(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    ...createIssueSchema.shape,
  });

  const { brandId, ...issueParams } = schema.parse(body);

  const issue = await jiraManager.createIssue(brandId, issueParams);

  return NextResponse.json({
    success: true,
    message: "Issue created",
    issue: {
      id: issue.id,
      key: issue.key,
      summary: issue.summary,
      status: issue.status.name,
      priority: issue.priority.name,
      url: `${jiraManager.getConnection(brandId)?.siteUrl}/browse/${issue.key}`,
    },
  });
}

async function handleCreateFromRecommendation(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    recommendation: createFromRecommendationSchema,
  });

  const { brandId, recommendation } = schema.parse(body);

  const issue = await jiraManager.createIssueFromRecommendation(brandId, {
    id: recommendation.recommendationId,
    title: recommendation.title,
    description: recommendation.description,
    priority: recommendation.priority,
    category: recommendation.category,
  });

  return NextResponse.json({
    success: true,
    message: "Issue created from recommendation",
    issue: {
      id: issue.id,
      key: issue.key,
      summary: issue.summary,
      status: issue.status.name,
      url: `${jiraManager.getConnection(brandId)?.siteUrl}/browse/${issue.key}`,
    },
    linkedRecommendation: recommendation.recommendationId,
  });
}

async function handleRegisterWebhook(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    webhookUrl: z.string().url(),
  });

  const { brandId, webhookUrl } = schema.parse(body);

  const webhook = await jiraManager.registerWebhook(brandId, webhookUrl);

  return NextResponse.json({
    success: true,
    message: "Webhook registered",
    webhook: {
      id: webhook.id,
      events: webhook.events,
      url: webhook.url,
    },
  });
}

async function handleProcessWebhook(body: unknown) {
  const event = webhookEventSchema.parse(body);

  const result = jiraManager.processWebhookEvent({
    webhookEvent: event.webhookEvent,
    issue: event.issue,
    changelog: event.changelog,
  });

  if (!result) {
    return NextResponse.json({
      success: true,
      processed: false,
      message: "Event not relevant",
    });
  }

  return NextResponse.json({
    success: true,
    processed: true,
    result: {
      type: result.type,
      issueKey: result.issueKey,
      recommendationId: result.recommendationId || null,
      newStatus: result.newStatus || null,
      isCompleted: result.isCompleted || false,
    },
  });
}

function handleDisconnect(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
  });

  const { brandId } = schema.parse(body);

  const disconnected = jiraManager.disconnect(brandId);

  if (!disconnected) {
    return NextResponse.json(
      { error: "No Jira connection found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Jira disconnected",
  });
}
