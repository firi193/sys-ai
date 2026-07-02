"use client"

import "@xyflow/react/dist/style.css"

import { useCallback, useRef, type DragEvent } from "react"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { DEFAULT_NODE_COLOR, type CanvasEdge, type CanvasNode } from "@/types/canvas"
import { CanvasNodeRenderer } from "./canvas-node"
import { ShapePanel, SHAPE_DRAG_MIME, type ShapeDragPayload } from "./shape-panel"

const NODE_TYPES = { canvasNode: CanvasNodeRenderer }

function CanvasFlow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      nodes: { initial: [] },
      edges: { initial: [] },
      suspense: true,
    })
  const { screenToFlowPosition } = useReactFlow<CanvasNode, CanvasEdge>()
  const nodeIdCounterRef = useRef(0)

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

  return (
    <div className="relative h-full w-full" onDragOver={handleDragOver} onDrop={handleDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={NODE_TYPES}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} />
        <MiniMap />
      </ReactFlow>
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
