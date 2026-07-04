"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react"
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react"
import { getNodeTextColor, MIN_NODE_SIZE, type CanvasNode, type NodeColorPair } from "@/types/canvas"
import { NodeColorToolbar } from "./node-color-toolbar"
import { ShapeVisual } from "./shape-visual"

interface CanvasNodeActions {
  updateLabel: (id: string, label: string) => void
  updateColor: (id: string, color: string) => void
}

const CanvasNodeActionsContext = createContext<CanvasNodeActions>({
  updateLabel: () => {},
  updateColor: () => {},
})

export const CanvasNodeActionsProvider = CanvasNodeActionsContext.Provider

const LABEL_PLACEHOLDER = "Label"

const HANDLE_STYLE = {
  width: 8,
  height: 8,
  backgroundColor: "#ffffff",
  border: "1px solid var(--border-default)",
}

const HANDLE_CLASS = "opacity-0 transition-opacity duration-150 group-hover:opacity-100"

const HANDLE_POSITIONS = [Position.Top, Position.Right, Position.Bottom, Position.Left]

const RESIZER_HANDLE_STYLE = {
  width: 8,
  height: 8,
  borderRadius: 2,
  backgroundColor: "var(--bg-elevated)",
  border: "1px solid var(--accent-primary)",
}

const RESIZER_LINE_STYLE = {
  borderColor: "var(--accent-primary)",
}

function NodeLabel({ label, color }: { label: string; color: string }) {
  const isEmpty = label.length === 0
  return (
    <span
      className="pointer-events-none absolute inset-0 flex items-center justify-center truncate px-3 text-center text-sm"
      style={{ color: isEmpty ? "var(--text-faint)" : color }}
    >
      {isEmpty ? LABEL_PLACEHOLDER : label}
    </span>
  )
}

function LabelEditor({
  value,
  color,
  onChange,
  onCommit,
  onCancel,
}: {
  value: string
  color: string
  onChange: (value: string) => void
  onCommit: () => void
  onCancel: () => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.focus()
    textarea.select()
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault()
      onCancel()
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center px-3">
      <textarea
        ref={textareaRef}
        value={value}
        placeholder={LABEL_PLACEHOLDER}
        rows={1}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        onBlur={onCommit}
        onKeyDown={handleKeyDown}
        className="nodrag nopan select-text max-h-full w-full resize-none border-none bg-transparent text-center text-sm outline-none placeholder:text-[color:var(--text-faint)]"
        style={{ color, userSelect: "text" }}
      />
    </div>
  )
}

export function CanvasNodeRenderer({ id, data, selected }: NodeProps<CanvasNode>) {
  const { updateLabel, updateColor } = useContext(CanvasNodeActionsContext)
  const textColor = getNodeTextColor(data.color)
  const strokeColor = selected ? "var(--accent-primary)" : "var(--border-default)"

  const [isEditing, setIsEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState(data.label)
  const originalLabelRef = useRef(data.label)

  const startEditing = useCallback(
    (event: ReactMouseEvent) => {
      event.stopPropagation()
      originalLabelRef.current = data.label
      setDraftLabel(data.label)
      setIsEditing(true)
    },
    [data.label]
  )

  const handleChange = useCallback(
    (value: string) => {
      setDraftLabel(value)
      updateLabel(id, value)
    },
    [id, updateLabel]
  )

  const handleCommit = useCallback(() => {
    setIsEditing(false)
  }, [])

  const handleCancel = useCallback(() => {
    updateLabel(id, originalLabelRef.current)
    setDraftLabel(originalLabelRef.current)
    setIsEditing(false)
  }, [id, updateLabel])

  const handleColorSelect = useCallback(
    (pair: NodeColorPair) => {
      updateColor(id, pair.fill)
    },
    [id, updateColor]
  )

  return (
    <div className="group relative h-full w-full" onDoubleClick={startEditing}>
      {selected ? (
        <NodeColorToolbar activeColor={data.color} onSelect={handleColorSelect} />
      ) : null}
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_NODE_SIZE.width}
        minHeight={MIN_NODE_SIZE.height}
        handleStyle={RESIZER_HANDLE_STYLE}
        lineStyle={RESIZER_LINE_STYLE}
      />
      <ShapeVisual shape={data.shape} color={data.color} strokeColor={strokeColor} />
      {isEditing ? (
        <LabelEditor
          value={draftLabel}
          color={textColor}
          onChange={handleChange}
          onCommit={handleCommit}
          onCancel={handleCancel}
        />
      ) : (
        <NodeLabel label={data.label} color={textColor} />
      )}
      {HANDLE_POSITIONS.map((position) => (
        <Handle
          key={position}
          id={position}
          type="source"
          position={position}
          className={HANDLE_CLASS}
          style={HANDLE_STYLE}
        />
      ))}
    </div>
  )
}
