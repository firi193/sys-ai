"use client"

import { Component, type ReactNode } from "react"
import { ClientSideSuspense, LiveblocksProvider, RoomProvider } from "@liveblocks/react"
import { Canvas } from "./canvas"
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave"

interface CanvasErrorBoundaryProps {
  children: ReactNode
}

interface CanvasErrorBoundaryState {
  hasError: boolean
}

class CanvasErrorBoundary extends Component<CanvasErrorBoundaryProps, CanvasErrorBoundaryState> {
  state: CanvasErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-sm text-error">
            Couldn&apos;t connect to the canvas. Try refreshing the page.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

interface CanvasRoomProps {
  roomId: string
  onSaveStatusChange?: (status: CanvasSaveStatus) => void
  children?: ReactNode
}

export function CanvasRoom({ roomId, onSaveStatusChange, children }: CanvasRoomProps) {
  return (
    <CanvasErrorBoundary>
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider id={roomId} initialPresence={{ cursor: null, thinking: false }}>
          <ClientSideSuspense
            fallback={
              <div className="flex h-full w-full items-center justify-center">
                <p className="text-sm text-copy-faint">Loading canvas…</p>
              </div>
            }
          >
            <Canvas projectId={roomId} onSaveStatusChange={onSaveStatusChange} />
          </ClientSideSuspense>
          {children}
        </RoomProvider>
      </LiveblocksProvider>
    </CanvasErrorBoundary>
  )
}
