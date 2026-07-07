"use client"

import { useCallback, useEffect, useState } from "react"

export interface ProjectSpecSummary {
  id: string
  createdAt: string
}

export function getSpecFilename(specId: string) {
  return `${specId}.md`
}

export function getSpecDownloadUrl(projectId: string, specId: string) {
  return `/api/projects/${projectId}/specs/${specId}/download`
}

export function triggerSpecDownload(projectId: string, specId: string) {
  const link = document.createElement("a")
  link.href = getSpecDownloadUrl(projectId, specId)
  link.download = getSpecFilename(specId)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

async function fetchProjectSpecs(projectId: string): Promise<ProjectSpecSummary[]> {
  const response = await fetch(`/api/projects/${projectId}/specs`)
  if (!response.ok) throw new Error("failed to load specs")
  const data = (await response.json()) as { specs: ProjectSpecSummary[] }
  return data.specs
}

export function useProjectSpecs(projectId: string) {
  const [specs, setSpecs] = useState<ProjectSpecSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchProjectSpecs(projectId)
      .then((result) => {
        if (!cancelled) setSpecs(result)
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load specs.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [projectId])

  // Not called from the effect above — only from event handlers (e.g. after a
  // spec finishes generating) — so setting state synchronously here is safe.
  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    return fetchProjectSpecs(projectId)
      .then((result) => setSpecs(result))
      .catch(() => setError("Couldn't load specs."))
      .finally(() => setLoading(false))
  }, [projectId])

  return { specs, loading, error, refresh }
}
