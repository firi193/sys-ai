"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProjectDialogsContext } from "@/components/editor/project-dialogs-context"

export function NewProjectButton() {
  const { openCreate } = useProjectDialogsContext()
  return (
    <Button onClick={openCreate}>
      <Plus className="h-4 w-4" />
      New Project
    </Button>
  )
}
