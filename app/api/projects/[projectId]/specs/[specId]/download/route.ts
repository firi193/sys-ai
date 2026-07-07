import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getCurrentUserIdentity, getProjectWithAccess } from "@/lib/project-access";
import prisma from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ projectId: string; specId: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const identity = await getCurrentUserIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, specId } = await params;
  const project = await getProjectWithAccess(projectId, identity);
  if (!project) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const spec = await prisma.projectSpec.findUnique({
    where: { id: specId },
    select: { projectId: true, filePath: true },
  });
  if (!spec || spec.projectId !== projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const blob = await get(spec.filePath, { access: "private" });
  if (!blob || blob.statusCode !== 200) {
    return NextResponse.json({ error: "Spec file not found" }, { status: 404 });
  }

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${specId}.md"`,
    },
  });
}
