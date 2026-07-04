"use client"

import { useRef, type DragEvent } from "react"
import { DEFAULT_NODE_COLOR, NODE_SHAPES, type CanvasNodeShape, type NodeShapeDefinition } from "@/types/canvas"
import { ShapeVisual } from "./shape-visual"

export const SHAPE_DRAG_MIME = "application/x-canvas-shape"

export interface ShapeDragPayload {
  shape: NodeShapeDefinition["shape"]
  width: number
  height: number
}

export function ShapePanel() {
  const previewRefs = useRef<Partial<Record<CanvasNodeShape, HTMLDivElement | null>>>({})

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, shape: NodeShapeDefinition) => {
    event.dataTransfer.effectAllowed = "move"
    const payload: ShapeDragPayload = {
      shape: shape.shape,
      width: shape.defaultSize.width,
      height: shape.defaultSize.height,
    }
    event.dataTransfer.setData(SHAPE_DRAG_MIME, JSON.stringify(payload))

    const preview = previewRefs.current[shape.shape]
    if (preview) {
      event.dataTransfer.setDragImage(
        preview,
        shape.defaultSize.width / 2,
        shape.defaultSize.height / 2
      )
    }
  }

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-surface-border bg-surface p-1.5 shadow-lg">
          {NODE_SHAPES.map((shape) => (
            <button
              key={shape.shape}
              type="button"
              draggable
              onDragStart={(event) => handleDragStart(event, shape)}
              title={shape.label}
              className="flex h-9 w-9 cursor-grab items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary active:cursor-grabbing"
            >
              <shape.icon className="h-5 w-5" />
            </button>
          ))}
        </div>
      </div>

      <div aria-hidden className="pointer-events-none fixed left-[-9999px] top-[-9999px]">
        {NODE_SHAPES.map((shape) => (
          <div
            key={shape.shape}
            ref={(el) => {
              previewRefs.current[shape.shape] = el
            }}
            style={{ width: shape.defaultSize.width, height: shape.defaultSize.height }}
          >
            <ShapeVisual shape={shape.shape} color={DEFAULT_NODE_COLOR.fill} />
          </div>
        ))}
      </div>
    </>
  )
}
