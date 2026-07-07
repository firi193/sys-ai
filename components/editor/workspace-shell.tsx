"use client"

import { useState } from "react"
import { AlertCircle, Bot, Check, Loader2, PanelLeftClose, PanelLeftOpen, Save, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectSidebar } from "./project-sidebar"
import { ProjectDialogsContext } from "./project-dialogs-context"
import { CreateProjectDialog } from "./create-project-dialog"
import { RenameProjectDialog } from "./rename-project-dialog"
import { DeleteProjectDialog } from "./delete-project-dialog"
import { ShareDialog } from "./share-dialog"
import { CanvasRoom } from "./canvas-room"
import { AISidebar } from "./ai-sidebar"
import { useProjectActions } from "@/hooks/use-project-actions"
import { useShareCollaborators } from "@/hooks/use-share-collaborators"
import type { ProjectItem } from "@/hooks/use-project-actions"
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave"

const SAVE_STATUS_CONFIG: Record<
  CanvasSaveStatus,
  { icon: typeof Save; label: string; className: string }
> = {
  idle: { icon: Save, label: "Save", className: "text-copy-muted" },
  saving: { icon: Loader2, label: "Saving…", className: "text-copy-muted" },
  saved: { icon: Check, label: "Saved", className: "text-success" },
  error: { icon: AlertCircle, label: "Save failed", className: "text-error" },
}

function SaveStatusIndicator({ status }: { status: CanvasSaveStatus }) {
  const { icon: Icon, label, className } = SAVE_STATUS_CONFIG[status]
  return (
    <span className={`flex items-center gap-1.5 px-2 text-xs ${className}`}>
      <Icon className={`h-3.5 w-3.5 ${status === "saving" ? "animate-spin" : ""}`} />
      {label}
    </span>
  )
}

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
  const [saveStatus, setSaveStatus] = useState<CanvasSaveStatus>("idle")
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

          <SaveStatusIndicator status={saveStatus} />

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
            <CanvasRoom roomId={roomId} onSaveStatusChange={setSaveStatus}>
              <AISidebar
                isOpen={isAISidebarOpen}
                onClose={() => setIsAISidebarOpen(false)}
                roomId={roomId}
              />
            </CanvasRoom>
          </main>
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
