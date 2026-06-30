import { auth, currentUser } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

export interface ProjectItem {
  id: string
  name: string
  owned: boolean
}

export async function getProjectsForCurrentUser(): Promise<{
  ownedProjects: ProjectItem[]
  sharedProjects: ProjectItem[]
}> {
  const { userId } = await auth()
  if (!userId) return { ownedProjects: [], sharedProjects: [] }

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress

  const [owned, collaborations] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    email
      ? prisma.projectCollaborator.findMany({
          where: { email },
          include: {
            project: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ])

  const ownedProjects: ProjectItem[] = owned.map((p) => ({ id: p.id, name: p.name, owned: true }))
  const sharedProjects: ProjectItem[] = collaborations.map((c) => ({
    id: c.project.id,
    name: c.project.name,
    owned: false,
  }))

  return { ownedProjects, sharedProjects }
}
