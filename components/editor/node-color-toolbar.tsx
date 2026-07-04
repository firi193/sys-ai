"use client"

import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react"
import { NODE_COLORS, type NodeColorPair } from "@/types/canvas"

interface NodeColorToolbarProps {
  activeColor: string
  onSelect: (pair: NodeColorPair) => void
}

export function NodeColorToolbar({ activeColor, onSelect }: NodeColorToolbarProps) {
  const stopPropagation = (event: ReactMouseEvent) => event.stopPropagation()

  return (
    <div
      className="nodrag nopan absolute bottom-full left-1/2 z-10 mb-2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-surface-border bg-surface p-1 shadow-lg"
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
    >
      {Object.entries(NODE_COLORS).map(([name, pair]) => {
        const isActive = pair.fill === activeColor
        return (
          <button
            key={name}
            type="button"
            title={name}
            onClick={() => onSelect(pair)}
            className="h-5 w-5 shrink-0 rounded-full transition-shadow duration-150 hover:shadow-[0_0_6px_0_var(--glow-color)]"
            style={
              {
                backgroundColor: pair.fill,
                border: isActive ? `2px solid ${pair.text}` : "1px solid var(--border-default)",
                boxShadow: isActive ? `0 0 4px 0 ${pair.text}` : undefined,
                "--glow-color": pair.text,
              } as CSSProperties
            }
          />
        )
      })}
    </div>
  )
}
