"use client"

import { useState } from "react"

export interface ProjectItem {
  id: string
  name: string
  owned: boolean
}

export type DialogType = "create" | "rename" | "delete" | null

export function useProjectDialogs() {
  const [dialog, setDialog] = useState<DialogType>(null)
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  const openCreate = () => {
    setName("")
    setDialog("create")
  }

  const openRename = (project: ProjectItem) => {
    setSelectedProject(project)
    setName(project.name)
    setDialog("rename")
  }

  const openDelete = (project: ProjectItem) => {
    setSelectedProject(project)
    setDialog("delete")
  }

  const close = () => {
    setDialog(null)
    setSelectedProject(null)
    setName("")
    setLoading(false)
  }

  return {
    dialog,
    selectedProject,
    name,
    setName,
    slug,
    loading,
    openCreate,
    openRename,
    openDelete,
    close,
  }
}
