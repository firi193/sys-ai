"use client"

import { X, Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useProjectDialogsContext } from "./project-dialogs-context"
import type { ProjectItem } from "@/hooks/use-project-actions"

function ProjectListItem({ project, isActive }: { project: ProjectItem; isActive?: boolean }) {
  const { openRename, openDelete } = useProjectDialogsContext()

  return (
    <div
      className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors ${
        isActive
          ? "bg-elevated border border-surface-border"
          : "hover:bg-elevated"
      }`}
    >
      <span className="flex-1 truncate text-sm text-copy-primary">{project.name}</span>
      {project.owned && (
        <div className="flex shrink-0 items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => { e.stopPropagation(); openRename(project) }}
            className="text-copy-muted hover:text-copy-primary"
          >
            <Pencil className="h-3 w-3" />
            <span className="sr-only">Rename</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => { e.stopPropagation(); openDelete(project) }}
            className="text-copy-muted hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      )}
    </div>
  )
}

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  ownedProjects: ProjectItem[]
  sharedProjects: ProjectItem[]
  activeProjectId?: string
}

export function ProjectSidebar({ isOpen, onClose, ownedProjects, sharedProjects, activeProjectId }: ProjectSidebarProps) {
  const { openCreate } = useProjectDialogsContext()

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-12 left-0 z-50 flex h-[calc(100vh-3rem)] w-72 flex-col bg-surface border-r border-surface-border transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <span className="text-sm font-medium text-copy-primary">Projects</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-copy-muted hover:text-copy-primary"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="my-projects" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="mx-3 mt-3 w-auto">
            <TabsTrigger value="my-projects" className="flex-1">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1">
              Shared
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects" className="flex flex-1 flex-col overflow-hidden px-2 py-2">
            {ownedProjects.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-xs text-copy-faint">No projects yet</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-0.5 pr-1">
                  {ownedProjects.map((project) => (
                    <ProjectListItem key={project.id} project={project} isActive={project.id === activeProjectId} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="shared" className="flex flex-1 flex-col overflow-hidden px-2 py-2">
            {sharedProjects.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-xs text-copy-faint">No shared projects</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-0.5 pr-1">
                  {sharedProjects.map((project) => (
                    <ProjectListItem key={project.id} project={project} isActive={project.id === activeProjectId} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <div className="border-t border-surface-border p-3">
          <Button variant="outline" className="w-full" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}
