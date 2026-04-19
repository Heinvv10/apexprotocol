import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
/**
 * Linear Integration API (F125)
 * GET /api/integrations/linear - Get connection status, teams, projects
 * POST /api/integrations/linear - OAuth flow, create issues
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { z } from "zod";
import {
  linearManager,
  formatLinearConnectionResponse,
} from "@/lib/integrations/linear";

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

      case "teams":
        return handleGetTeams(brandId);

      case "projects":
        return handleGetProjects(brandId);

      case "states":
        return handleGetWorkflowStates(brandId);

      case "labels":
        return handleGetLabels(brandId);

      case "authUrl": {
        const state = searchParams.get("state") || crypto.randomUUID();
        return handleGetAuthUrl(brandId, state);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: status, teams, projects, states, labels, authUrl" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process Linear request",
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

      case "selectTeam":
        return handleSelectTeam(body);

      case "selectProject":
        return handleSelectProject(body);

      case "createIssue":
        return handleCreateIssue(body);

      case "createFromRecommendation":
        return handleCreateFromRecommendation(body);

      case "disconnect":
        return handleDisconnect(body);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: callback, selectTeam, selectProject, createIssue, createFromRecommendation, disconnect" },
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
        error: "Linear operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET handlers
function handleGetStatus(brandId: string) {
  const connection = linearManager.getConnection(brandId);

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
    connection: formatLinearConnectionResponse(connection),
  });
}

async function handleGetTeams(brandId: string) {
  const teams = await linearManager.getTeams(brandId);

  return NextResponse.json({
    success: true,
    teams,
  });
}

async function handleGetProjects(brandId: string) {
  const projects = await linearManager.getProjects(brandId);

  return NextResponse.json({
    success: true,
    projects,
  });
}

async function handleGetWorkflowStates(brandId: string) {
  const states = await linearManager.getWorkflowStates(brandId);

  return NextResponse.json({
    success: true,
    states,
  });
}

async function handleGetLabels(brandId: string) {
  const labels = await linearManager.getLabels(brandId);

  return NextResponse.json({
    success: true,
    labels,
  });
}

function handleGetAuthUrl(brandId: string, state: string) {
  const authUrl = linearManager.getAuthorizationUrl(brandId, state);

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

  // Exchange code for token
  const tokens = await linearManager.exchangeCodeForToken(code);

  // Create connection
  const connection = await linearManager.createConnection(brandId, tokens.accessToken);

  return NextResponse.json({
    success: true,
    message: "Linear connected successfully. Select a team.",
    connection: formatLinearConnectionResponse(connection),
  });
}

function handleSelectTeam(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    teamId: z.string().min(1),
    teamName: z.string().min(1),
  });

  const { brandId, teamId, teamName } = schema.parse(body);

  const connection = linearManager.selectTeam(brandId, teamId, teamName);

  if (!connection) {
    return NextResponse.json(
      { error: "No Linear connection found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Team selected. Ready to create issues.",
    connection: formatLinearConnectionResponse(connection),
  });
}

function handleSelectProject(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    projectId: z.string().min(1),
    projectName: z.string().min(1),
  });

  const { brandId, projectId, projectName } = schema.parse(body);

  const connection = linearManager.selectProject(brandId, projectId, projectName);

  if (!connection) {
    return NextResponse.json(
      { error: "No Linear connection found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Project selected.",
    connection: formatLinearConnectionResponse(connection),
  });
}

async function handleCreateIssue(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    priority: z.number().min(0).max(4).optional(),
    stateId: z.string().optional(),
    labelIds: z.array(z.string()).optional(),
    projectId: z.string().optional(),
    assigneeId: z.string().optional(),
    dueDate: z.string().optional(),
  });

  const { brandId, ...issueParams } = schema.parse(body);

  const issue = await linearManager.createIssue(brandId, issueParams);

  return NextResponse.json({
    success: true,
    message: "Issue created successfully",
    issue: {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      url: issue.url,
      priority: issue.priorityLabel,
      state: issue.state.name,
    },
  });
}

async function handleCreateFromRecommendation(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    recommendation: z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      description: z.string(),
      priority: z.string(),
      category: z.string(),
    }),
  });

  const { brandId, recommendation } = schema.parse(body);

  const issue = await linearManager.createIssueFromRecommendation(
    brandId,
    recommendation
  );

  return NextResponse.json({
    success: true,
    message: "Linear issue created from recommendation",
    issue: {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      url: issue.url,
      priority: issue.priorityLabel,
      state: issue.state.name,
    },
    linkedRecommendation: recommendation.id,
  });
}

function handleDisconnect(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
  });

  const { brandId } = schema.parse(body);

  const disconnected = linearManager.disconnect(brandId);

  if (!disconnected) {
    return NextResponse.json(
      { error: "No Linear connection found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Linear disconnected",
  });
}
