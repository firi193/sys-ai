import type { Edge, Node } from "@xyflow/react"
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
  type LucideIcon,
} from "lucide-react"

export type CanvasNodeShape =
  | "rectangle"
  | "diamond"
  | "circle"
  | "pill"
  | "cylinder"
  | "hexagon"

export interface CanvasNodeData extends Record<string, unknown> {
  label: string
  color: string
  shape: CanvasNodeShape
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">
export type CanvasEdge = Edge<Record<string, never>, "canvasEdge">

export interface NodeColorPair {
  fill: string
  text: string
}

export const NODE_COLORS: Record<string, NodeColorPair> = {
  neutral: { fill: "#1F1F1F", text: "#EDEDED" },
  blue: { fill: "#10233D", text: "#52A8FF" },
  purple: { fill: "#2E1938", text: "#BF7AF0" },
  orange: { fill: "#331B00", text: "#FF990A" },
  red: { fill: "#3C1618", text: "#FF6166" },
  pink: { fill: "#3A1726", text: "#F75F8F" },
  green: { fill: "#0F2E18", text: "#62C073" },
  teal: { fill: "#062822", text: "#0AC7B4" },
}

export const DEFAULT_NODE_COLOR = NODE_COLORS.neutral

export function getNodeTextColor(fill: string): string {
  const match = Object.values(NODE_COLORS).find((pair) => pair.fill === fill)
  return match?.text ?? DEFAULT_NODE_COLOR.text
}

export interface CanvasNodeSize {
  width: number
  height: number
}

export interface NodeShapeDefinition {
  shape: CanvasNodeShape
  label: string
  icon: LucideIcon
  defaultSize: CanvasNodeSize
}

export const NODE_SHAPES: NodeShapeDefinition[] = [
  { shape: "rectangle", label: "Rectangle", icon: RectangleHorizontal, defaultSize: { width: 160, height: 80 } },
  { shape: "diamond", label: "Diamond", icon: Diamond, defaultSize: { width: 140, height: 140 } },
  { shape: "circle", label: "Circle", icon: Circle, defaultSize: { width: 100, height: 100 } },
  { shape: "pill", label: "Pill", icon: Pill, defaultSize: { width: 140, height: 60 } },
  { shape: "cylinder", label: "Cylinder", icon: Cylinder, defaultSize: { width: 100, height: 120 } },
  { shape: "hexagon", label: "Hexagon", icon: Hexagon, defaultSize: { width: 120, height: 100 } },
]
