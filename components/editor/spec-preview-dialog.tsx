"use client"

import { useEffect, useState } from "react"
import { Download, Loader2 } from "lucide-react"
import Markdown, { type Components } from "react-markdown"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getSpecDownloadUrl, getSpecFilename, triggerSpecDownload } from "@/hooks/use-project-specs"

const markdownComponents: Components = {
  h1: (props) => <h1 className="mt-4 mb-2 text-lg font-semibold text-copy-primary first:mt-0" {...props} />,
  h2: (props) => <h2 className="mt-4 mb-2 text-base font-semibold text-copy-primary first:mt-0" {...props} />,
  h3: (props) => <h3 className="mt-3 mb-1.5 text-sm font-semibold text-copy-primary first:mt-0" {...props} />,
  p: (props) => <p className="mb-2 text-sm leading-relaxed text-copy-secondary last:mb-0" {...props} />,
  ul: (props) => <ul className="mb-2 list-disc space-y-1 pl-5 text-sm text-copy-secondary" {...props} />,
  ol: (props) => <ol className="mb-2 list-decimal space-y-1 pl-5 text-sm text-copy-secondary" {...props} />,
  li: (props) => <li {...props} />,
  strong: (props) => <strong className="font-semibold text-copy-primary" {...props} />,
  a: (props) => <a className="text-brand underline underline-offset-2" {...props} />,
  code: (props) => <code className="rounded bg-subtle px-1 py-0.5 font-mono text-xs text-copy-primary" {...props} />,
  pre: (props) => <pre className="mb-2 overflow-x-auto rounded-xl bg-subtle p-3 font-mono text-xs text-copy-primary" {...props} />,
}

interface SpecPreviewDialogProps {
  projectId: string
  specId: string | null
  onOpenChange: (open: boolean) => void
}

interface LoadedSpec {
  specId: string
  content: string | null
  error: string | null
}

export function SpecPreviewDialog({ projectId, specId, onOpenChange }: SpecPreviewDialogProps) {
  const [loaded, setLoaded] = useState<LoadedSpec | null>(null)

  useEffect(() => {
    if (!specId) return
    let cancelled = false

    fetch(getSpecDownloadUrl(projectId, specId))
      .then((response) => {
        if (!response.ok) throw new Error("failed to load spec")
        return response.text()
      })
      .then((text) => {
        if (!cancelled) setLoaded({ specId, content: text, error: null })
      })
      .catch(() => {
        if (!cancelled) setLoaded({ specId, content: null, error: "Couldn't load this spec." })
      })

    return () => {
      cancelled = true
    }
  }, [projectId, specId])

  const isCurrent = loaded?.specId === specId
  const loading = specId !== null && !isCurrent
  const content = isCurrent ? (loaded?.content ?? null) : null
  const error = isCurrent ? (loaded?.error ?? null) : null

  return (
    <Dialog open={specId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] w-full max-w-2xl flex-col gap-3 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">
            {specId ? getSpecFilename(specId) : "Spec"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 rounded-xl border border-surface-border bg-elevated">
          <div className="px-4 py-3">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-copy-muted" />
              </div>
            ) : error ? (
              <p className="text-sm text-error">{error}</p>
            ) : (
              <Markdown components={markdownComponents}>{content ?? ""}</Markdown>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={!specId}
            onClick={() => specId && triggerSpecDownload(projectId, specId)}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
