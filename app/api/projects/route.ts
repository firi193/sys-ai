import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: unknown = await request.json().catch(() => ({}));

  const name =
    typeof body === "object" && body !== null && "name" in body && typeof (body as Record<string, unknown>).name === "string"
      ? ((body as Record<string, string>).name.trim() || "Untitled Project")
      : "Untitled Project";

  const rawId =
    typeof body === "object" && body !== null && "id" in body && typeof (body as Record<string, unknown>).id === "string"
      ? (body as Record<string, string>).id.trim()
      : "";
  const customId = /^[a-z0-9-]{1,100}$/.test(rawId) ? rawId : undefined;

  const project = await prisma.project.create({
    data: {
      ...(customId ? { id: customId } : {}),
      ownerId: userId,
      name,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
