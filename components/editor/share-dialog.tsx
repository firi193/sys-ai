"use client"

import { Check, Copy, Loader2, X } from "lucide-react"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import type { CollaboratorProfile } from "@/lib/collaborators"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isOwner: boolean
  collaborators: CollaboratorProfile[]
  loading: boolean
  email: string
  setEmail: (email: string) => void
  inviting: boolean
  removingId: string | null
  error: string | null
  copied: boolean
  invite: () => void
  remove: (collaboratorId: string) => void
  copyLink: () => void
}

export function ShareDialog({
  open,
  onOpenChange,
  isOwner,
  collaborators,
  loading,
  email,
  setEmail,
  inviting,
  removingId,
  error,
  copied,
  invite,
  remove,
  copyLink,
}: ShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
          <DialogDescription>
            {isOwner ? "Invite collaborators by email." : "View who has access to this project."}
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <Input
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && email.trim()) invite()
                }}
                disabled={inviting}
                autoFocus
              />
              <Button disabled={!email.trim() || inviting} onClick={invite}>
                {inviting ? "Inviting…" : "Invite"}
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-copy-muted">Collaborators</span>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-copy-faint" />
            </div>
          ) : collaborators.length === 0 ? (
            <p className="py-4 text-center text-xs text-copy-faint">No collaborators yet</p>
          ) : (
            <ScrollArea className="max-h-48">
              <div className="flex flex-col gap-0.5 pr-1">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-elevated"
                  >
                    {collaborator.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={collaborator.avatarUrl}
                        alt=""
                        className="h-6 w-6 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-elevated text-[10px] font-medium text-copy-muted">
                        {collaborator.email.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-1 flex-col overflow-hidden">
                      <span className="truncate text-sm text-copy-primary">
                        {collaborator.name ?? collaborator.email}
                      </span>
                      {collaborator.name && (
                        <span className="truncate text-xs text-copy-faint">{collaborator.email}</span>
                      )}
                    </div>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => remove(collaborator.id)}
                        disabled={removingId === collaborator.id}
                        className="shrink-0 text-copy-muted hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={copyLink} className="gap-1.5">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy link"}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
