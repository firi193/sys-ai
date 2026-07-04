import type { CanvasNodeShape } from "@/types/canvas"

interface ShapeVisualProps {
  shape: CanvasNodeShape
  color: string
  strokeColor?: string
}

export function ShapeVisual({ shape, color, strokeColor }: ShapeVisualProps) {
  const stroke = strokeColor ?? "var(--border-default)"
  const svgStroke = { stroke, strokeWidth: 1 }

  switch (shape) {
    case "circle":
    case "pill":
      return (
        <div
          className="h-full w-full rounded-full border"
          style={{ backgroundColor: color, borderColor: stroke }}
        />
      )

    case "rectangle":
      return (
        <div
          className="h-full w-full rounded-md border"
          style={{ backgroundColor: color, borderColor: stroke }}
        />
      )

    case "diamond":
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <polygon
            points="50,2 98,50 50,98 2,50"
            style={{ fill: color, ...svgStroke }}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )

    case "hexagon":
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <polygon
            points="25,2 75,2 98,50 75,98 25,98 2,50"
            style={{ fill: color, ...svgStroke }}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )

    case "cylinder":
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <path
            d="M5 20 L5 80 A45 12 0 0 0 95 80 L95 20"
            style={{ fill: color, ...svgStroke }}
            vectorEffect="non-scaling-stroke"
          />
          <ellipse
            cx="50"
            cy="20"
            rx="45"
            ry="12"
            style={{ fill: color, ...svgStroke }}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )
  }
}
