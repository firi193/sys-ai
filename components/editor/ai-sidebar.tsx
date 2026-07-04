"use client"

import { useState, type KeyboardEvent } from "react"
import { Bot, Download, FileText, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

const PLACEHOLDER_REPLY =
  "This is a placeholder response. Ghost AI generation isn't wired up yet."

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

function AIArchitectTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")

  const sendMessage = (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    setMessages((prev) => [
      ...prev,
      { id: `${prev.length}-user`, role: "user", content: trimmed },
      { id: `${prev.length}-assistant`, role: "assistant", content: PLACEHOLDER_REPLY },
    ])
    setDraft("")
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(draft)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 px-3 py-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
              <Bot className="h-8 w-8 text-copy-faint" />
              <p className="text-sm text-copy-muted">
                Describe what you want to build and Ghost AI will help design the architecture.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full bg-subtle px-3 py-1.5 text-xs text-ai-text transition-colors hover:bg-elevated"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "ml-auto border-2 border-brand/50 bg-brand-dim text-copy-primary"
                    : "mr-auto border border-surface-border bg-elevated text-ai-text"
                }`}
              >
                {message.content}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-surface-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Ghost AI to design something..."
            className="min-h-[72px] max-h-[160px] flex-1 resize-none bg-elevated border-surface-border text-copy-primary placeholder:text-copy-faint"
          />
          <Button
            size="icon"
            onClick={() => sendMessage(draft)}
            disabled={!draft.trim()}
            className="h-8 w-8 shrink-0 bg-ai text-white hover:bg-ai/90"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

function SpecsTab() {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
      <Button className="w-full bg-ai text-white hover:bg-ai/90">Generate Spec</Button>

      <div className="rounded-2xl border border-surface-border bg-elevated p-3">
        <div className="flex items-start gap-2">
          <FileText className="h-5 w-5 shrink-0 text-ai-text" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-copy-primary">Checkout Service Spec</p>
            <p className="mt-1 line-clamp-3 text-xs text-copy-muted">
              Defines the checkout flow: cart validation, payment intent creation, order
              persistence, and webhook handling for downstream fulfillment.
            </p>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" disabled className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </div>
    </div>
  )
}

interface AISidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AISidebar({ isOpen, onClose }: AISidebarProps) {
  return (
    <aside
      className={`fixed top-12 right-0 z-50 flex h-[calc(100vh-3rem)] w-96 flex-col border-l border-surface-border bg-base/95 shadow-2xl transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-ai-text" />
          <div>
            <p className="text-sm font-medium text-copy-primary">AI Workspace</p>
            <p className="text-xs text-copy-muted">Collaborate with Ghost AI</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 text-copy-muted hover:text-copy-primary"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      <Tabs defaultValue="architect" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-3 mt-3 w-auto">
          <TabsTrigger
            value="architect"
            className="flex-1 text-copy-muted data-active:bg-ai data-active:text-ai-text"
          >
            AI Architect
          </TabsTrigger>
          <TabsTrigger
            value="specs"
            className="flex-1 text-copy-muted data-active:bg-ai data-active:text-ai-text"
          >
            Specs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="architect" className="flex flex-1 flex-col overflow-hidden">
          <AIArchitectTab />
        </TabsContent>

        <TabsContent value="specs" className="flex flex-1 flex-col overflow-hidden">
          <SpecsTab />
        </TabsContent>
      </Tabs>
    </aside>
  )
}
