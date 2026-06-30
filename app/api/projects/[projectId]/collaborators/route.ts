import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { getCurrentUserIdentity, getProjectWithAccess } from "@/lib/project-access";
import { listCollaboratorsWithProfiles } from "@/lib/collaborators";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(_request: Request, { params }: RouteContext) {
  const identity = await getCurrentUserIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;
  const project = await getProjectWithAccess(projectId, identity);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const collaborators = await listCollaboratorsWithProfiles(projectId);
  return NextResponse.json({ collaborators });
}

export async function POST(request: Request, { params }: RouteContext) {
  const identity = await getCurrentUserIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.ownerId !== identity.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: unknown = await request.json().catch(() => ({}));
  const rawEmail =
    typeof body === "object" && body !== null && "email" in body && typeof (body as Record<string, unknown>).email === "string"
      ? (body as Record<string, string>).email.trim().toLowerCase()
      : "";

  if (!EMAIL_RE.test(rawEmail)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (identity.email && rawEmail === identity.email.toLowerCase()) {
    return NextResponse.json({ error: "You already own this project" }, { status: 400 });
  }

  try {
    await prisma.projectCollaborator.create({
      data: { projectId, email: rawEmail },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Already a collaborator" }, { status: 409 });
    }
    throw error;
  }

  const collaborators = await listCollaboratorsWithProfiles(projectId);
  return NextResponse.json({ collaborators }, { status: 201 });
}
