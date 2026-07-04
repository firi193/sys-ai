"use client"

import { useEffect, useRef, useState } from "react"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error"

const AUTOSAVE_DEBOUNCE_MS = 1500

export function useCanvasAutosave(projectId: string, nodes: CanvasNode[], edges: CanvasEdge[]) {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle")
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipFirstRef = useRef(true)

  useEffect(() => {
    if (skipFirstRef.current) {
      skipFirstRef.current = false
      return
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      setStatus("saving")
      fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to save canvas")
          setStatus("saved")
        })
        .catch(() => setStatus("error"))
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [projectId, nodes, edges])

  return status
}
