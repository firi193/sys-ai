"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useProjectDialogsContext } from "./project-dialogs-context"

export function CreateProjectDialog() {
  const { dialog, name, setName, roomId, loading, close, handleCreate } = useProjectDialogsContext()

  return (
    <Dialog open={dialog === "create"} onOpenChange={(open) => { if (!open) close() }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Give your architecture workspace a name.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) handleCreate() }}
            autoFocus
          />
          <p className="text-xs text-copy-faint">
            Room ID:{" "}
            <span className="font-mono text-copy-muted">{roomId || "—"}</span>
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={loading}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || loading} onClick={handleCreate}>
            {loading ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
