"use client"

import { useState } from "react"
import type { CollaboratorProfile } from "@/lib/collaborators"

export function useShareCollaborators(projectId: string, isOwner: boolean) {
  const [open, setOpen] = useState(false)
  const [collaborators, setCollaborators] = useState<CollaboratorProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const openDialog = async () => {
    setOpen(true)
    setError(null)
    setEmail("")
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`)
      const data = res.ok ? ((await res.json()) as { collaborators: CollaboratorProfile[] }) : null
      setCollaborators(data?.collaborators ?? [])
    } finally {
      setLoading(false)
    }
  }

  const invite = async () => {
    if (!email.trim() || !isOwner) return
    setInviting(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = (await res.json()) as { collaborators?: CollaboratorProfile[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Failed to invite collaborator")
      setCollaborators(data.collaborators ?? [])
      setEmail("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite collaborator")
    } finally {
      setInviting(false)
    }
  }

  const remove = async (collaboratorId: string) => {
    if (!isOwner) return
    setRemovingId(collaboratorId)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators/${collaboratorId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to remove collaborator")
      setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove collaborator")
    } finally {
      setRemovingId(null)
    }
  }

  const copyLink = async () => {
    const link = `${window.location.origin}/editor/${projectId}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return {
    open,
    setOpen,
    openDialog,
    collaborators,
    loading,
    email,
    setEmail,
    inviting,
    removingId,
    error,
    copied,
    invite,
    remove,
    copyLink,
  }
}
