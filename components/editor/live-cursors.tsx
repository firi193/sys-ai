"use client"

import { useOthers } from "@liveblocks/react"
import { useReactFlow, useViewport } from "@xyflow/react"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

export function LiveCursors() {
  const others = useOthers()
  const { flowToScreenPosition } = useReactFlow<CanvasNode, CanvasEdge>()
  // Subscribing to the viewport forces a re-render on every pan/zoom so
  // cursor screen positions (derived from flow coordinates) stay in sync.
  useViewport()

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {others.map((other) => {
        const cursor = other.presence.cursor
        if (!cursor) return null

        // flowToScreenPosition returns viewport (client) coordinates, which
        // line up directly with this fixed-positioned overlay.
        const { x: left, y: top } = flowToScreenPosition(cursor)
        const color = other.info?.color ?? "var(--accent-primary)"
        const name = other.info?.name ?? "Anonymous"

        return (
          <div
            key={other.connectionId}
            className="absolute -translate-x-px -translate-y-px"
            style={{ left, top }}
          >
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
              <path
                d="M1 1L15 7.5L8.2 9L5.5 16L1 1Z"
                fill={color}
                stroke="white"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="absolute top-4 left-3 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium text-white shadow-lg"
              style={{ backgroundColor: color }}
            >
              {name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
