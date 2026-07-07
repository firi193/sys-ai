import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getCurrentUserIdentity, getProjectWithAccess } from "@/lib/project-access";
import prisma from "@/lib/prisma";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

interface CanvasPayload {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

function parseCanvasPayload(body: unknown): CanvasPayload | null {
  if (typeof body !== "object" || body === null) return null;
  const { nodes, edges } = body as Record<string, unknown>;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) return null;
  return { nodes: nodes as CanvasNode[], edges: edges as CanvasEdge[] };
}

export async function PUT(request: Request, { params }: RouteContext) {
  const identity = await getCurrentUserIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;
  const project = await getProjectWithAccess(projectId, identity);
  if (!project) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: unknown = await request.json().catch(() => null);
  const payload = parseCanvasPayload(body);
  if (!payload) return NextResponse.json({ error: "nodes and edges are required" }, { status: 400 });

  const blob = await put(`canvas/${projectId}.json`, JSON.stringify(payload), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { canvasJsonPath: blob.url },
  });

  return NextResponse.json({ url: blob.url });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const identity = await getCurrentUserIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;
  const project = await getProjectWithAccess(projectId, identity);
  if (!project) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const record = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });
  if (!record?.canvasJsonPath) return NextResponse.json({ canvas: null });

  const blobResponse = await fetch(record.canvasJsonPath, { cache: "no-store" });
  if (!blobResponse.ok) return NextResponse.json({ canvas: null });

  const canvas = (await blobResponse.json()) as CanvasPayload;
  return NextResponse.json({ canvas });
}
