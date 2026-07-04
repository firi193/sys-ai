"use client"

import "@xyflow/react/dist/style.css"

import { useCallback, useEffect, useRef, type DragEvent, type PointerEvent } from "react"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { useCanRedo, useCanUndo, useMyPresence, useRedo, useUndo } from "@liveblocks/react"
import { DEFAULT_NODE_COLOR, type CanvasEdge, type CanvasNode } from "@/types/canvas"
import { useCanvasDelete } from "@/hooks/use-canvas-delete"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useCanvasAutosave, type CanvasSaveStatus } from "@/hooks/use-canvas-autosave"
import { CanvasControlBar } from "./canvas-control-bar"
import { CanvasNodeActionsProvider, CanvasNodeRenderer } from "./canvas-node"
import { LiveCursors } from "./live-cursors"
import { PresenceAvatars } from "./presence-avatars"
import { ShapePanel, SHAPE_DRAG_MIME, type ShapeDragPayload } from "./shape-panel"

const NODE_TYPES = { canvasNode: CanvasNodeRenderer }

interface CanvasFlowProps {
  projectId: string
  onSaveStatusChange?: (status: CanvasSaveStatus) => void
}

interface SavedCanvasResponse {
  canvas: { nodes: CanvasNode[]; edges: CanvasEdge[] } | null
}

function CanvasFlow({ projectId, onSaveStatusChange }: CanvasFlowProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      nodes: { initial: [] },
      edges: { initial: [] },
      suspense: true,
    })
  const reactFlowInstance = useReactFlow<CanvasNode, CanvasEdge>()
  const { screenToFlowPosition } = reactFlowInstance
  const nodeIdCounterRef = useRef(0)
  const [, updateMyPresence] = useMyPresence()

  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()

  useKeyboardShortcuts({ reactFlowInstance, undo, redo })
  useCanvasDelete({ onDelete })

  const saveStatus = useCanvasAutosave(projectId, nodes, edges)
  useEffect(() => {
    onSaveStatusChange?.(saveStatus)
  }, [saveStatus, onSaveStatusChange])

  const hasAttemptedLoadRef = useRef(false)
  useEffect(() => {
    if (hasAttemptedLoadRef.current) return
    hasAttemptedLoadRef.current = true

    if (nodes.length > 0 || edges.length > 0) return

    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`)
        if (!res.ok || cancelled) return
        const data = (await res.json()) as SavedCanvasResponse
        if (!data.canvas || cancelled) return
        if (data.canvas.nodes.length > 0) {
          onNodesChange(data.canvas.nodes.map((item) => ({ type: "add", item })))
        }
        if (data.canvas.edges.length > 0) {
          onEdgesChange(data.canvas.edges.map((item) => ({ type: "add", item })))
        }
      } catch {
        // Ignore — the canvas simply starts empty.
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      updateMyPresence({ cursor: screenToFlowPosition({ x: event.clientX, y: event.clientY }) })
    },
    [screenToFlowPosition, updateMyPresence]
  )

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const raw = event.dataTransfer.getData(SHAPE_DRAG_MIME)
      if (!raw) return

      let payload: ShapeDragPayload
      try {
        payload = JSON.parse(raw)
      } catch {
        return
      }

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      const container = nodeIdCounterRef.current++
      const id = `${payload.shape}-${Date.now()}-${container}`

      const newNode: CanvasNode = {
        id,
        type: "canvasNode",
        position,
        data: { label: "", color: DEFAULT_NODE_COLOR.fill, shape: payload.shape },
        style: { width: payload.width, height: payload.height },
      }

      onNodesChange([{ type: "add", item: newNode }])
    },
    [screenToFlowPosition, onNodesChange]
  )

  const updateLabel = useCallback(
    (id: string, label: string) => {
      const node = nodes.find((candidate) => candidate.id === id)
      if (!node) return
      onNodesChange([{ id, type: "replace", item: { ...node, data: { ...node.data, label } } }])
    },
    [nodes, onNodesChange]
  )

  const updateColor = useCallback(
    (id: string, color: string) => {
      const node = nodes.find((candidate) => candidate.id === id)
      if (!node) return
      onNodesChange([{ id, type: "replace", item: { ...node, data: { ...node.data, color } } }])
    },
    [nodes, onNodesChange]
  )

  return (
    <div
      className="relative h-full w-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <CanvasNodeActionsProvider value={{ updateLabel, updateColor }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDelete={onDelete}
          nodeTypes={NODE_TYPES}
          connectionMode={ConnectionMode.Loose}
          zoomOnDoubleClick={false}
          deleteKeyCode={null}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} />
        </ReactFlow>
      </CanvasNodeActionsProvider>
      <LiveCursors />
      <CanvasControlBar
        reactFlowInstance={reactFlowInstance}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />
      <ShapePanel />
      <PresenceAvatars />
    </div>
  )
}

interface CanvasProps {
  projectId: string
  onSaveStatusChange?: (status: CanvasSaveStatus) => void
}

export function Canvas({ projectId, onSaveStatusChange }: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasFlow projectId={projectId} onSaveStatusChange={onSaveStatusChange} />
    </ReactFlowProvider>
  )
}
