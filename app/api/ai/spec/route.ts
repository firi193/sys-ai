import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserIdentity, getProjectWithAccess } from "@/lib/project-access";
import prisma from "@/lib/prisma";
import { canvasEdgeSchema, canvasNodeSchema, generateSpec } from "@/trigger/generate-spec";
import { chatFeedMessageSchema } from "@/types/tasks";

const specRequestSchema = z.object({
  roomId: z.string().min(1),
  chatHistory: z.array(chatFeedMessageSchema),
  nodes: z.array(canvasNodeSchema),
  edges: z.array(canvasEdgeSchema),
});

export async function POST(request: Request) {
  const identity = await getCurrentUserIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const parsed = specRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "roomId, chatHistory, nodes, and edges are required" },
      { status: 400 }
    );
  }
  const { roomId, chatHistory, nodes, edges } = parsed.data;

  const project = await getProjectWithAccess(roomId, identity);
  if (!project) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const run = await generateSpec.trigger({
    projectId: project.id,
    roomId,
    chatHistory,
    nodes,
    edges,
  });

  await prisma.taskRun.create({
    data: {
      runId: run.id,
      projectId: project.id,
      userId: identity.userId,
    },
  });

  return NextResponse.json({ runId: run.id }, { status: 201 });
}
