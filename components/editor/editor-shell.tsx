"use client"

import { useState } from "react"
import { useProjectActions } from "@/hooks/use-project-actions"
import { ProjectDialogsContext } from "./project-dialogs-context"
import { EditorNavbar } from "./editor-navbar"
import { ProjectSidebar } from "./project-sidebar"
import { CreateProjectDialog } from "./create-project-dialog"
import { RenameProjectDialog } from "./rename-project-dialog"
import { DeleteProjectDialog } from "./delete-project-dialog"
import type { ProjectItem } from "@/hooks/use-project-actions"

interface EditorShellProps {
  ownedProjects: ProjectItem[]
  sharedProjects: ProjectItem[]
  children: React.ReactNode
}

export function EditorShell({ ownedProjects, sharedProjects, children }: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const dialogs = useProjectActions()

  return (
    <ProjectDialogsContext.Provider value={dialogs}>
      <div className="relative h-screen w-screen overflow-hidden bg-base">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
        />
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
        />
        <main className="pt-12 h-full">{children}</main>
        <CreateProjectDialog />
        <RenameProjectDialog />
        <DeleteProjectDialog />
      </div>
    </ProjectDialogsContext.Provider>
  )
}
