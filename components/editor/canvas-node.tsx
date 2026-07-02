"use client"

import type { NodeProps } from "@xyflow/react"
import type { CanvasNode } from "@/types/canvas"
import { getNodeTextColor } from "@/types/canvas"

const SVG_STROKE = { stroke: "var(--border-default)", strokeWidth: 1 }

function NodeLabel({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="pointer-events-none absolute inset-0 flex items-center justify-center truncate px-3 text-center text-sm"
      style={{ color }}
    >
      {label}
    </span>
  )
}

export function CanvasNodeRenderer({ data }: NodeProps<CanvasNode>) {
  const textColor = getNodeTextColor(data.color)
  const label = <NodeLabel label={data.label} color={textColor} />

  switch (data.shape) {
    case "circle":
    case "pill":
      return (
        <div className="relative h-full w-full">
          <div
            className="h-full w-full rounded-full border border-surface-border"
            style={{ backgroundColor: data.color }}
          />
          {label}
        </div>
      )

    case "diamond":
      return (
        <div className="relative h-full w-full">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            <polygon
              points="50,2 98,50 50,98 2,50"
              style={{ fill: data.color, ...SVG_STROKE }}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {label}
        </div>
      )

    case "hexagon":
      return (
        <div className="relative h-full w-full">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            <polygon
              points="25,2 75,2 98,50 75,98 25,98 2,50"
              style={{ fill: data.color, ...SVG_STROKE }}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {label}
        </div>
      )

    case "cylinder":
      return (
        <div className="relative h-full w-full">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            <path
              d="M5 20 L5 80 A45 12 0 0 0 95 80 L95 20"
              style={{ fill: data.color, ...SVG_STROKE }}
              vectorEffect="non-scaling-stroke"
            />
            <ellipse
              cx="50"
              cy="20"
              rx="45"
              ry="12"
              style={{ fill: data.color, ...SVG_STROKE }}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {label}
        </div>
      )

    case "rectangle":
      return (
        <div className="relative h-full w-full">
          <div
            className="h-full w-full rounded-md border border-surface-border"
            style={{ backgroundColor: data.color }}
          />
          {label}
        </div>
      )
  }
}
