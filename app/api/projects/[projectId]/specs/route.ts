import { NextResponse } from "next/server";
import { getCurrentUserIdentity, getProjectWithAccess } from "@/lib/project-access";
import prisma from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const identity = await getCurrentUserIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;
  const project = await getProjectWithAccess(projectId, identity);
  if (!project) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const specs = await prisma.projectSpec.findMany({
    where: { projectId },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ specs });
}
