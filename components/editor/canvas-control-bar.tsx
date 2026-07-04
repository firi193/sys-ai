"use client"

import { Maximize, Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react"
import type { KeyboardShortcutsReactFlowInstance } from "@/hooks/use-keyboard-shortcuts"

const ANIMATION_DURATION = 200

const BUTTON_CLASS =
  "flex h-9 w-9 items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary disabled:pointer-events-none disabled:opacity-40"

interface CanvasControlBarProps {
  reactFlowInstance: Pick<KeyboardShortcutsReactFlowInstance, "zoomIn" | "zoomOut"> & {
    fitView: (options?: { duration?: number }) => void
  }
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

export function CanvasControlBar({
  reactFlowInstance,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: CanvasControlBarProps) {
  return (
    <div className="pointer-events-none absolute bottom-6 left-6 z-20">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-surface-border bg-surface p-1.5 shadow-lg">
        <button
          type="button"
          title="Zoom out"
          className={BUTTON_CLASS}
          onClick={() => reactFlowInstance.zoomOut({ duration: ANIMATION_DURATION })}
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <button
          type="button"
          title="Fit view"
          className={BUTTON_CLASS}
          onClick={() => reactFlowInstance.fitView({ duration: ANIMATION_DURATION })}
        >
          <Maximize className="h-5 w-5" />
        </button>
        <button
          type="button"
          title="Zoom in"
          className={BUTTON_CLASS}
          onClick={() => reactFlowInstance.zoomIn({ duration: ANIMATION_DURATION })}
        >
          <ZoomIn className="h-5 w-5" />
        </button>

        <div className="mx-1 h-6 w-px bg-surface-border" />

        <button
          type="button"
          title="Undo"
          className={BUTTON_CLASS}
          onClick={onUndo}
          disabled={!canUndo}
        >
          <Undo2 className="h-5 w-5" />
        </button>
        <button
          type="button"
          title="Redo"
          className={BUTTON_CLASS}
          onClick={onRedo}
          disabled={!canRedo}
        >
          <Redo2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
