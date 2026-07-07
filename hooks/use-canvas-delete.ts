import { useEffect } from "react"
import { useEdges, useNodes, type OnDelete } from "@xyflow/react"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === "INPUT" || tag === "TEXTAREA"
}

interface UseCanvasDeleteOptions {
  onDelete: OnDelete<CanvasNode, CanvasEdge>
}

export function useCanvasDelete({ onDelete }: UseCanvasDeleteOptions) {
  const nodes = useNodes<CanvasNode>()
  const edges = useEdges<CanvasEdge>()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return
      if (event.key !== "Delete" && event.key !== "Backspace") return

      const selectedNodes = nodes.filter((node) => node.selected)
      const selectedEdges = edges.filter((edge) => edge.selected)
      if (selectedNodes.length === 0 && selectedEdges.length === 0) return

      event.preventDefault()
      onDelete({ nodes: selectedNodes, edges: selectedEdges })
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [nodes, edges, onDelete])
}
