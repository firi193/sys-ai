"use client"

import "@xyflow/react/dist/style.css"

import { useCallback, useRef, type DragEvent } from "react"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { useCanRedo, useCanUndo, useRedo, useUndo } from "@liveblocks/react"
import { DEFAULT_NODE_COLOR, type CanvasEdge, type CanvasNode } from "@/types/canvas"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { CanvasControlBar } from "./canvas-control-bar"
import { CanvasNodeActionsProvider, CanvasNodeRenderer } from "./canvas-node"
import { ShapePanel, SHAPE_DRAG_MIME, type ShapeDragPayload } from "./shape-panel"

const NODE_TYPES = { canvasNode: CanvasNodeRenderer }

function CanvasFlow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      nodes: { initial: [] },
      edges: { initial: [] },
      suspense: true,
    })
  const reactFlowInstance = useReactFlow<CanvasNode, CanvasEdge>()
  const { screenToFlowPosition } = reactFlowInstance
  const nodeIdCounterRef = useRef(0)

  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()

  useKeyboardShortcuts({ reactFlowInstance, undo, redo })

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

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
    <div className="relative h-full w-full" onDragOver={handleDragOver} onDrop={handleDrop}>
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
          fitView
        >
          <Background variant={BackgroundVariant.Dots} />
        </ReactFlow>
      </CanvasNodeActionsProvider>
      <CanvasControlBar
        reactFlowInstance={reactFlowInstance}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />
      <ShapePanel />
    </div>
  )
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasFlow />
    </ReactFlowProvider>
  )
}
