import { auth, currentUser } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

export interface UserIdentity {
  userId: string
  email: string | null
}

export interface AccessibleProject {
  id: string
  name: string
  ownerId: string
}

export async function getCurrentUserIdentity(): Promise<UserIdentity | null> {
  const { userId } = await auth()
  if (!userId) return null
  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress ?? null
  return { userId, email }
}

export async function getProjectWithAccess(
  projectId: string,
  identity: UserIdentity
): Promise<AccessibleProject | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, ownerId: true },
  })
  if (!project) return null
  if (project.ownerId === identity.userId) return project
  if (identity.email) {
    const collab = await prisma.projectCollaborator.findFirst({
      where: { projectId: project.id, email: identity.email },
    })
    if (collab) return project
  }
  return null
}
