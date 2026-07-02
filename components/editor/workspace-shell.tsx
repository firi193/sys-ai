"use client"

import { useState } from "react"
import { Bot, PanelLeftClose, PanelLeftOpen, Share2 } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ProjectSidebar } from "./project-sidebar"
import { ProjectDialogsContext } from "./project-dialogs-context"
import { CreateProjectDialog } from "./create-project-dialog"
import { RenameProjectDialog } from "./rename-project-dialog"
import { DeleteProjectDialog } from "./delete-project-dialog"
import { ShareDialog } from "./share-dialog"
import { CanvasRoom } from "./canvas-room"
import { useProjectActions } from "@/hooks/use-project-actions"
import { useShareCollaborators } from "@/hooks/use-share-collaborators"
import type { ProjectItem } from "@/hooks/use-project-actions"

interface WorkspaceShellProps {
  project: { id: string; name: string }
  roomId: string
  ownedProjects: ProjectItem[]
  sharedProjects: ProjectItem[]
  isOwner: boolean
}

export function WorkspaceShell({ project, roomId, ownedProjects, sharedProjects, isOwner }: WorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false)
  const dialogs = useProjectActions()
  const share = useShareCollaborators(project.id, isOwner)

  return (
    <ProjectDialogsContext.Provider value={dialogs}>
      <div className="fixed inset-0 z-50 flex flex-col bg-base">
        <nav className="flex h-12 shrink-0 items-center gap-2 border-b border-surface-border bg-surface px-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="h-8 w-8 text-copy-secondary hover:text-copy-primary"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </Button>

          <span className="flex-1 truncate text-sm font-medium text-copy-primary">
            {project.name}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={share.openDialog}
            className="gap-1.5 text-copy-secondary hover:text-copy-primary"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAISidebarOpen((prev) => !prev)}
            className="h-8 w-8 text-copy-secondary hover:text-copy-primary"
          >
            <Bot className="h-5 w-5" />
          </Button>

          <UserButton />
        </nav>

        <div className="relative flex flex-1 overflow-hidden">
          <ProjectSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            ownedProjects={ownedProjects}
            sharedProjects={sharedProjects}
            activeProjectId={roomId}
          />

          <main className="relative flex-1 bg-base">
            <CanvasRoom roomId={roomId} />
          </main>

          {isAISidebarOpen && (
            <aside className="flex w-80 shrink-0 flex-col border-l border-surface-border bg-surface">
              <div className="flex h-12 items-center border-b border-surface-border px-4">
                <span className="text-sm font-medium text-copy-primary">AI Assistant</span>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <p className="text-xs text-copy-faint">AI chat coming soon</p>
              </div>
            </aside>
          )}
        </div>

        <CreateProjectDialog />
        <RenameProjectDialog />
        <DeleteProjectDialog />
        <ShareDialog
          open={share.open}
          onOpenChange={share.setOpen}
          isOwner={isOwner}
          collaborators={share.collaborators}
          loading={share.loading}
          email={share.email}
          setEmail={share.setEmail}
          inviting={share.inviting}
          removingId={share.removingId}
          error={share.error}
          copied={share.copied}
          invite={share.invite}
          remove={share.remove}
          copyLink={share.copyLink}
        />
      </div>
    </ProjectDialogsContext.Provider>
  )
}
