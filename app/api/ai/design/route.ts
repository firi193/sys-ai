import { NextResponse } from "next/server";
import { getCurrentUserIdentity, getProjectWithAccess } from "@/lib/project-access";
import prisma from "@/lib/prisma";
import { designAgent } from "@/trigger/design-agent";

interface DesignRequestBody {
  prompt: string;
  roomId: string;
  projectId: string;
}

function parseDesignRequest(body: unknown): DesignRequestBody | null {
  if (typeof body !== "object" || body === null) return null;
  const { prompt, roomId, projectId } = body as Record<string, unknown>;
  if (typeof prompt !== "string" || !prompt.trim()) return null;
  if (typeof roomId !== "string" || !roomId.trim()) return null;
  if (typeof projectId !== "string" || !projectId.trim()) return null;
  return { prompt, roomId, projectId };
}

export async function POST(request: Request) {
  const identity = await getCurrentUserIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const payload = parseDesignRequest(body);
  if (!payload) {
    return NextResponse.json({ error: "prompt, roomId, and projectId are required" }, { status: 400 });
  }

  const project = await getProjectWithAccess(payload.projectId, identity);
  if (!project) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const run = await designAgent.trigger({ prompt: payload.prompt, roomId: payload.roomId });

  await prisma.taskRun.create({
    data: {
      runId: run.id,
      projectId: payload.projectId,
      userId: identity.userId,
    },
  });

  return NextResponse.json({ runId: run.id }, { status: 201 });
}
