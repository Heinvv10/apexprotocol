/**
 * Asana Integration API (F126)
 * GET /api/integrations/asana - Get connection status, workspaces, projects
 * POST /api/integrations/asana - OAuth flow, create tasks
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  asanaManager,
  formatAsanaConnectionResponse,
} from "@/lib/integrations/asana";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

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

      case "workspaces":
        return handleGetWorkspaces(brandId);

      case "projects":
        return handleGetProjects(brandId);

      case "sections":
        return handleGetSections(brandId);

      case "users":
        return handleGetUsers(brandId);

      case "tags":
        return handleGetTags(brandId);

      case "authUrl": {
        const state = searchParams.get("state") || crypto.randomUUID();
        return handleGetAuthUrl(brandId, state);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: status, workspaces, projects, sections, users, tags, authUrl" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process Asana request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

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

      case "selectWorkspace":
        return handleSelectWorkspace(body);

      case "selectProject":
        return handleSelectProject(body);

      case "selectSection":
        return handleSelectSection(body);

      case "createTask":
        return handleCreateTask(body);

      case "createFromRecommendation":
        return handleCreateFromRecommendation(body);

      case "disconnect":
        return handleDisconnect(body);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: callback, selectWorkspace, selectProject, selectSection, createTask, createFromRecommendation, disconnect" },
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
        error: "Asana operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET handlers
function handleGetStatus(brandId: string) {
  const connection = asanaManager.getConnection(brandId);

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
    connection: formatAsanaConnectionResponse(connection),
  });
}

async function handleGetWorkspaces(brandId: string) {
  const workspaces = await asanaManager.getWorkspaces(brandId);

  return NextResponse.json({
    success: true,
    workspaces,
  });
}

async function handleGetProjects(brandId: string) {
  const projects = await asanaManager.getProjects(brandId);

  return NextResponse.json({
    success: true,
    projects,
  });
}

async function handleGetSections(brandId: string) {
  const sections = await asanaManager.getSections(brandId);

  return NextResponse.json({
    success: true,
    sections,
  });
}

async function handleGetUsers(brandId: string) {
  const users = await asanaManager.getUsers(brandId);

  return NextResponse.json({
    success: true,
    users,
  });
}

async function handleGetTags(brandId: string) {
  const tags = await asanaManager.getTags(brandId);

  return NextResponse.json({
    success: true,
    tags,
  });
}

function handleGetAuthUrl(brandId: string, state: string) {
  const authUrl = asanaManager.getAuthorizationUrl(brandId, state);

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
  const tokens = await asanaManager.exchangeCodeForTokens(code);

  // Create connection
  const connection = asanaManager.createConnection(
    brandId,
    tokens.accessToken,
    tokens.refreshToken,
    tokens.expiresIn,
    tokens.userId,
    tokens.userName,
    tokens.userEmail
  );

  return NextResponse.json({
    success: true,
    message: "Asana connected successfully. Select a workspace.",
    connection: formatAsanaConnectionResponse(connection),
  });
}

function handleSelectWorkspace(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    workspaceId: z.string().min(1),
    workspaceName: z.string().min(1),
  });

  const { brandId, workspaceId, workspaceName } = schema.parse(body);

  const connection = asanaManager.selectWorkspace(brandId, workspaceId, workspaceName);

  if (!connection) {
    return NextResponse.json(
      { error: "No Asana connection found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Workspace selected. Now select a project.",
    connection: formatAsanaConnectionResponse(connection),
  });
}

function handleSelectProject(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    projectId: z.string().min(1),
    projectName: z.string().min(1),
  });

  const { brandId, projectId, projectName } = schema.parse(body);

  const connection = asanaManager.selectProject(brandId, projectId, projectName);

  if (!connection) {
    return NextResponse.json(
      { error: "No Asana connection found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Project selected. Ready to create tasks.",
    connection: formatAsanaConnectionResponse(connection),
  });
}

function handleSelectSection(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    sectionId: z.string().min(1),
    sectionName: z.string().min(1),
  });

  const { brandId, sectionId, sectionName } = schema.parse(body);

  const connection = asanaManager.selectSection(brandId, sectionId, sectionName);

  if (!connection) {
    return NextResponse.json(
      { error: "No Asana connection found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Section selected.",
    connection: formatAsanaConnectionResponse(connection),
  });
}

async function handleCreateTask(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    name: z.string().min(1),
    notes: z.string().optional(),
    htmlNotes: z.string().optional(),
    dueOn: z.string().optional(),
    dueAt: z.string().optional(),
    startOn: z.string().optional(),
    assignee: z.string().optional(),
    tags: z.array(z.string()).optional(),
  });

  const { brandId, ...taskParams } = schema.parse(body);

  const task = await asanaManager.createTask(brandId, taskParams);

  return NextResponse.json({
    success: true,
    message: "Task created successfully",
    task: {
      gid: task.gid,
      name: task.name,
      url: task.permalink_url,
      completed: task.completed,
      dueOn: task.dueOn,
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

  const task = await asanaManager.createTaskFromRecommendation(
    brandId,
    recommendation
  );

  return NextResponse.json({
    success: true,
    message: "Asana task created from recommendation",
    task: {
      gid: task.gid,
      name: task.name,
      url: task.permalink_url,
      completed: task.completed,
    },
    linkedRecommendation: recommendation.id,
  });
}

function handleDisconnect(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
  });

  const { brandId } = schema.parse(body);

  const disconnected = asanaManager.disconnect(brandId);

  if (!disconnected) {
    return NextResponse.json(
      { error: "No Asana connection found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Asana disconnected",
  });
}
