import { redirect } from "next/navigation"
import { getCurrentUserIdentity, getProjectWithAccess } from "@/lib/project-access"
import { getProjectsForCurrentUser } from "@/lib/data/projects"
import { AccessDenied } from "@/components/editor/access-denied"
import { WorkspaceShell } from "@/components/editor/workspace-shell"

interface PageProps {
  params: Promise<{ roomId: string }>
}

export default async function EditorRoomPage({ params }: PageProps) {
  const { roomId } = await params

  const identity = await getCurrentUserIdentity()
  if (!identity) redirect("/sign-in")

  const project = await getProjectWithAccess(roomId, identity)
  if (!project) return <AccessDenied />

  const { ownedProjects, sharedProjects } = await getProjectsForCurrentUser()
  const isOwner = project.ownerId === identity.userId

  return (
    <WorkspaceShell
      project={project}
      roomId={roomId}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
      isOwner={isOwner}
    />
  )
}
