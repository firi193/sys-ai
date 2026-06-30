import { getProjectsForCurrentUser } from "@/lib/data/projects"
import { EditorShell } from "@/components/editor/editor-shell"

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const { ownedProjects, sharedProjects } = await getProjectsForCurrentUser()

  return (
    <EditorShell ownedProjects={ownedProjects} sharedProjects={sharedProjects}>
      {children}
    </EditorShell>
  )
}
