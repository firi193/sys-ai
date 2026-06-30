"use client"

import type { KeyboardEvent } from "react"
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

export function RenameProjectDialog() {
  const { dialog, selectedProject, name, setName, loading, close, handleRename } = useProjectDialogsContext()

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && name.trim()) {
      handleRename()
    }
  }

  return (
    <Dialog open={dialog === "rename"} onOpenChange={(open) => { if (!open) close() }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Rename Project</DialogTitle>
          <DialogDescription>
            Renaming{" "}
            <span className="font-medium text-copy-secondary">{selectedProject?.name}</span>
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={loading}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || loading} onClick={handleRename}>
            {loading ? "Renaming…" : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
