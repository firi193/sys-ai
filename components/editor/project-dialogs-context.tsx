"use client"

import { createContext, useContext } from "react"
import type { ProjectItem, DialogType } from "@/hooks/use-project-dialogs"

export interface ProjectDialogsContextValue {
  dialog: DialogType
  selectedProject: ProjectItem | null
  name: string
  setName: (name: string) => void
  slug: string
  loading: boolean
  openCreate: () => void
  openRename: (project: ProjectItem) => void
  openDelete: (project: ProjectItem) => void
  close: () => void
}

export const ProjectDialogsContext = createContext<ProjectDialogsContextValue | null>(null)

export function useProjectDialogsContext(): ProjectDialogsContextValue {
  const ctx = useContext(ProjectDialogsContext)
  if (!ctx) throw new Error("useProjectDialogsContext must be used within a ProjectDialogsContext.Provider")
  return ctx
}
