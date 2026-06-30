"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"

export interface ProjectItem {
  id: string
  name: string
  owned: boolean
}

export type DialogType = "create" | "rename" | "delete" | null

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function generateSuffix(): string {
  return Math.random().toString(36).slice(2, 6)
}

export function useProjectActions() {
  const router = useRouter()
  const params = useParams()

  const [dialog, setDialog] = useState<DialogType>(null)
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null)
  const [name, setName] = useState("")
  const [suffix, setSuffix] = useState("")
  const [loading, setLoading] = useState(false)

  const slug = slugify(name)
  const roomId = slug ? `${slug}-${suffix}` : ""

  const openCreate = () => {
    setName("")
    setSuffix(generateSuffix())
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

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), id: roomId || undefined }),
      })
      if (!res.ok) throw new Error("Failed to create project")
      const data = (await res.json()) as { project: { id: string } }
      close()
      router.push(`/editor/${data.project.id}`)
    } catch {
      setLoading(false)
    }
  }

  const handleRename = async () => {
    if (!name.trim() || !selectedProject) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) throw new Error("Failed to rename project")
      close()
      router.refresh()
    } catch {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedProject) return
    setLoading(true)
    const activeProjectId =
      typeof params?.projectId === "string" ? params.projectId : null
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete project")
      close()
      if (activeProjectId === selectedProject.id) {
        router.push("/editor")
      } else {
        router.refresh()
      }
    } catch {
      setLoading(false)
    }
  }

  return {
    dialog,
    selectedProject,
    name,
    setName,
    slug,
    roomId,
    loading,
    openCreate,
    openRename,
    openDelete,
    close,
    handleCreate,
    handleRename,
    handleDelete,
  }
}
