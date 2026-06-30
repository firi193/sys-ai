import { Lock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function AccessDenied() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-base">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-elevated border border-surface-border">
        <Lock className="h-6 w-6 text-copy-muted" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-medium text-copy-primary">Access denied</p>
        <p className="text-xs text-copy-muted">
          This project doesn&apos;t exist or you don&apos;t have access.
        </p>
      </div>
      <Button variant="ghost" asChild>
        <Link href="/editor">Back to editor</Link>
      </Button>
    </div>
  )
}
