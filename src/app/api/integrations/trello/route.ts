import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Trello Integration API (F124)
 * GET /api/integrations/trello - Get connection status, boards, lists
 * POST /api/integrations/trello - OAuth flow, create cards
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { z } from "zod";
import {
  trelloManager,
  formatTrelloConnectionResponse,
} from "@/lib/integrations/trello";

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

      case "boards":
        return handleGetBoards(brandId);

      case "lists":
        return handleGetLists(brandId);

      case "labels":
        return handleGetLabels(brandId);

      case "authUrl": {
        const state = searchParams.get("state") || crypto.randomUUID();
        return handleGetAuthUrl(brandId, state);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: status, boards, lists, labels, authUrl" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process Trello request",
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

      case "selectBoard":
        return handleSelectBoard(body);

      case "selectList":
        return handleSelectList(body);

      case "createCard":
        return handleCreateCard(body);

      case "createFromRecommendation":
        return handleCreateFromRecommendation(body);

      case "disconnect":
        return handleDisconnect(body);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: callback, selectBoard, selectList, createCard, createFromRecommendation, disconnect" },
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
        error: "Trello operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET handlers
function handleGetStatus(brandId: string) {
  const connection = trelloManager.getConnection(brandId);

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
    connection: formatTrelloConnectionResponse(connection),
  });
}

async function handleGetBoards(brandId: string) {
  const boards = await trelloManager.getBoards(brandId);

  return NextResponse.json({
    success: true,
    boards,
  });
}

async function handleGetLists(brandId: string) {
  const lists = await trelloManager.getLists(brandId);

  return NextResponse.json({
    success: true,
    lists,
  });
}

async function handleGetLabels(brandId: string) {
  const labels = await trelloManager.getLabels(brandId);

  return NextResponse.json({
    success: true,
    labels,
  });
}

function handleGetAuthUrl(brandId: string, state: string) {
  const authUrl = trelloManager.getAuthorizationUrl(brandId, state);

  return NextResponse.json({
    success: true,
    authUrl,
    state,
  });
}

// POST handlers
async function handleOAuthCallback(body: unknown) {
  const schema = z.object({
    accessToken: z.string().min(1),
    state: z.string().min(1),
  });

  const { accessToken, state } = schema.parse(body);
  const [brandId] = state.split(":");

  if (!brandId) {
    return NextResponse.json(
      { error: "Invalid state parameter" },
      { status: 400 }
    );
  }

  const connection = await trelloManager.createConnection(brandId, accessToken);

  return NextResponse.json({
    success: true,
    message: "Trello connected successfully. Select a board.",
    connection: formatTrelloConnectionResponse(connection),
  });
}

function handleSelectBoard(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    boardId: z.string().min(1),
    boardName: z.string().min(1),
  });

  const { brandId, boardId, boardName } = schema.parse(body);

  const connection = trelloManager.selectBoard(brandId, boardId, boardName);

  if (!connection) {
    return NextResponse.json(
      { error: "No Trello connection found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Board selected. Now select a list.",
    connection: formatTrelloConnectionResponse(connection),
  });
}

function handleSelectList(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    listId: z.string().min(1),
    listName: z.string().min(1),
  });

  const { brandId, listId, listName } = schema.parse(body);

  const connection = trelloManager.selectList(brandId, listId, listName);

  if (!connection) {
    return NextResponse.json(
      { error: "No Trello connection found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "List selected. Ready to create cards.",
    connection: formatTrelloConnectionResponse(connection),
  });
}

async function handleCreateCard(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    name: z.string().min(1),
    desc: z.string().optional(),
    pos: z.union([z.literal("top"), z.literal("bottom"), z.number()]).optional(),
    due: z.string().optional(),
    idLabels: z.array(z.string()).optional(),
    urlSource: z.string().url().optional(),
  });

  const { brandId, ...cardParams } = schema.parse(body);

  const card = await trelloManager.createCard(brandId, cardParams);

  return NextResponse.json({
    success: true,
    message: "Card created successfully",
    card: {
      id: card.id,
      name: card.name,
      url: card.url,
      shortUrl: card.shortUrl,
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
      url: z.string().url().optional(),
    }),
  });

  const { brandId, recommendation } = schema.parse(body);

  const card = await trelloManager.createCardFromRecommendation(
    brandId,
    recommendation
  );

  return NextResponse.json({
    success: true,
    message: "Trello card created from recommendation",
    card: {
      id: card.id,
      name: card.name,
      url: card.url,
      shortUrl: card.shortUrl,
    },
    linkedRecommendation: recommendation.id,
  });
}

function handleDisconnect(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
  });

  const { brandId } = schema.parse(body);

  const disconnected = trelloManager.disconnect(brandId);

  if (!disconnected) {
    return NextResponse.json(
      { error: "No Trello connection found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Trello disconnected",
  });
}
