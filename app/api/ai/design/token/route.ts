import { NextResponse } from "next/server";
import { auth as triggerAuth } from "@trigger.dev/sdk";
import { getCurrentUserIdentity } from "@/lib/project-access";
import prisma from "@/lib/prisma";

function parseTokenRequest(body: unknown): { runId: string } | null {
  if (typeof body !== "object" || body === null) return null;
  const { runId } = body as Record<string, unknown>;
  if (typeof runId !== "string" || !runId.trim()) return null;
  return { runId };
}

export async function POST(request: Request) {
  const identity = await getCurrentUserIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const payload = parseTokenRequest(body);
  if (!payload) return NextResponse.json({ error: "runId is required" }, { status: 400 });

  const taskRun = await prisma.taskRun.findUnique({ where: { runId: payload.runId } });
  if (!taskRun || taskRun.userId !== identity.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = await triggerAuth.createPublicToken({
    scopes: { read: { runs: [payload.runId] } },
  });

  return NextResponse.json({ token });
}
