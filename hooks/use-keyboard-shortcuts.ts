import { useEffect } from "react"

export interface KeyboardShortcutsReactFlowInstance {
  zoomIn: (options?: { duration?: number }) => void
  zoomOut: (options?: { duration?: number }) => void
}

interface UseKeyboardShortcutsOptions {
  reactFlowInstance: KeyboardShortcutsReactFlowInstance
  undo: () => void
  redo: () => void
}

const ZOOM_ANIMATION_DURATION = 200

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === "INPUT" || tag === "TEXTAREA"
}

export function useKeyboardShortcuts({ reactFlowInstance, undo, redo }: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return

      const isModifierPressed = event.metaKey || event.ctrlKey

      if (isModifierPressed && event.key.toLowerCase() === "z") {
        event.preventDefault()
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
        return
      }

      if (isModifierPressed && event.key.toLowerCase() === "y") {
        event.preventDefault()
        redo()
        return
      }

      if (isModifierPressed) return

      if (event.key === "+" || event.key === "=") {
        event.preventDefault()
        reactFlowInstance.zoomIn({ duration: ZOOM_ANIMATION_DURATION })
        return
      }

      if (event.key === "-") {
        event.preventDefault()
        reactFlowInstance.zoomOut({ duration: ZOOM_ANIMATION_DURATION })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [reactFlowInstance, undo, redo])
}
