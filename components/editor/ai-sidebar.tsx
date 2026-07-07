"use client"

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react"
import { Bot, Download, FileText, Loader2, Send, X } from "lucide-react"
import {
  useCreateFeed,
  useCreateFeedMessage,
  useFeedMessages,
  useOthers,
  useSelf,
} from "@liveblocks/react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import type { designAgent } from "@/trigger/design-agent"
import type { generateSpec } from "@/trigger/generate-spec"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SpecPreviewDialog } from "@/components/editor/spec-preview-dialog"
import {
  getSpecFilename,
  triggerSpecDownload,
  useProjectSpecs,
  type ProjectSpecSummary,
} from "@/hooks/use-project-specs"
import {
  AI_CHAT_FEED_ID,
  AI_STATUS_FEED_ID,
  isAIStatusFeedMessageData,
  isChatFeedMessageData,
  type ChatFeedMessageData,
} from "@/types/tasks"

// Run statuses under which a triggered run hasn't reached a terminal outcome yet.
const ACTIVE_RUN_STATUSES = new Set<string>([
  "PENDING_VERSION",
  "QUEUED",
  "DEQUEUED",
  "EXECUTING",
  "WAITING",
  "DELAYED",
])

/**
 * Drives one design-agent run end to end: POST /api/ai/design → POST
 * /api/ai/design/token → subscribe with useRealtimeRun. The two-request
 * handshake mirrors the existing API split (spec 20 kept trigger + token
 * issuance as separate routes) rather than a single endpoint returning both.
 */
function useDesignAgentRun(roomId: string) {
  const [runId, setRunId] = useState<string | undefined>()
  const [publicToken, setPublicToken] = useState<string | undefined>()
  const [isStarting, setIsStarting] = useState(false)
  const createFeedMessage = useCreateFeedMessage()

  const { run } = useRealtimeRun<typeof designAgent>(runId, {
    accessToken: publicToken,
    enabled: Boolean(runId && publicToken),
  })

  const postAssistantMessage = useCallback(
    (content: string) =>
      createFeedMessage(AI_CHAT_FEED_ID, {
        sender: "Ghost AI",
        role: "assistant",
        content,
        timestamp: Date.now(),
      }).catch(() => {}),
    [createFeedMessage]
  )

  // Fires once per run when it reaches a terminal status — guarded by id so
  // re-renders (or the run object updating with the same terminal status)
  // don't repost the same completion message.
  const handledRunIdRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!run || ACTIVE_RUN_STATUSES.has(run.status)) return
    if (handledRunIdRef.current === run.id) return
    handledRunIdRef.current = run.id
    void postAssistantMessage(
      run.status === "COMPLETED"
        ? "Ghost AI finished updating the canvas."
        : `Ghost AI run ${run.status.toLowerCase().replace(/_/g, " ")}.`
    )
  }, [run, postAssistantMessage])

  const submitPrompt = useCallback(
    async (prompt: string) => {
      setIsStarting(true)
      try {
        const designResponse = await fetch("/api/ai/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, roomId, projectId: roomId }),
        })
        if (!designResponse.ok) throw new Error("design-request-failed")
        const { runId: newRunId } = (await designResponse.json()) as { runId: string }

        const tokenResponse = await fetch("/api/ai/design/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: newRunId }),
        })
        if (!tokenResponse.ok) throw new Error("token-request-failed")
        const { token } = (await tokenResponse.json()) as { token: string }

        setRunId(newRunId)
        setPublicToken(token)
      } catch {
        await postAssistantMessage("Ghost AI couldn't start — please try again.")
      } finally {
        setIsStarting(false)
      }
    },
    [roomId, postAssistantMessage]
  )

  // Once `run` reflects the subscribed run, its own status is authoritative;
  // `runId` alone only carries the "active" signal in the brief window before
  // the realtime subscription has produced a run object yet.
  const isRunActive =
    isStarting || (run ? ACTIVE_RUN_STATUSES.has(run.status) : Boolean(runId))

  return { isRunActive, submitPrompt }
}

function useAIActivity() {
  const others = useOthers()
  const isAIThinking = others.some((other) => other.presence.thinking)

  const createFeed = useCreateFeed()
  const hasEnsuredFeed = useRef(false)
  useEffect(() => {
    if (hasEnsuredFeed.current) return
    hasEnsuredFeed.current = true
    // Idempotent: a feed only needs to exist once per room, and this call is
    // safe to lose the race against another client doing the same thing.
    createFeed(AI_STATUS_FEED_ID).catch(() => {})
  }, [createFeed])

  const feedResult = useFeedMessages(AI_STATUS_FEED_ID)
  const messages = feedResult.isLoading || feedResult.error ? undefined : feedResult.messages
  const latestMessage = messages?.length
    ? messages.reduce((latest, message) => (message.createdAt > latest.createdAt ? message : latest))
    : null
  const statusText =
    latestMessage && isAIStatusFeedMessageData(latestMessage.data) ? latestMessage.data.text : undefined

  return { isAIThinking, statusText }
}

interface ChatFeedMessage extends ChatFeedMessageData {
  id: string
}

function useChatFeed() {
  const createFeed = useCreateFeed()
  const hasEnsuredFeed = useRef(false)
  useEffect(() => {
    if (hasEnsuredFeed.current) return
    hasEnsuredFeed.current = true
    // Idempotent, same reasoning as ai-status-feed: safe to lose the race
    // against another client's create call for the same room-scoped feed.
    createFeed(AI_CHAT_FEED_ID).catch(() => {})
  }, [createFeed])

  const feedResult = useFeedMessages(AI_CHAT_FEED_ID)
  const rawMessages = feedResult.isLoading || feedResult.error ? [] : feedResult.messages
  // .flatMap (rather than .filter with a type predicate) so each valid message's fields
  // are read out individually right after the isChatFeedMessageData check — the predicate
  // narrows message.data by intersection, not by replacement, so pulling fields out here
  // keeps the resulting array's element type as plain ChatFeedMessage instead of leaking
  // the intersection through to callers.
  const messages: ChatFeedMessage[] = rawMessages
    .flatMap((message) =>
      isChatFeedMessageData(message.data)
        ? [
            {
              id: message.id,
              sender: message.data.sender,
              role: message.data.role,
              content: message.data.content,
              timestamp: message.data.timestamp,
            },
          ]
        : []
    )
    .sort((a, b) => a.timestamp - b.timestamp)

  const createFeedMessage = useCreateFeedMessage()

  return { messages, createFeedMessage }
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatSpecDate(createdAt: string) {
  return new Date(createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
}

/**
 * Drives one spec-generation run end to end: POST /api/ai/spec → POST
 * /api/ai/spec/token → subscribe with useRealtimeRun. Mirrors
 * useDesignAgentRun's two-request handshake and Ghost-AI-chat-message error
 * reporting exactly, since the backend (spec 25/26) follows the same
 * trigger/token-route split as the design agent.
 */
function useSpecGenerationRun(roomId: string, onComplete: () => void) {
  const [runId, setRunId] = useState<string | undefined>()
  const [publicToken, setPublicToken] = useState<string | undefined>()
  const [isStarting, setIsStarting] = useState(false)
  const createFeedMessage = useCreateFeedMessage()

  const { run } = useRealtimeRun<typeof generateSpec>(runId, {
    accessToken: publicToken,
    enabled: Boolean(runId && publicToken),
  })

  const postAssistantMessage = useCallback(
    (content: string) =>
      createFeedMessage(AI_CHAT_FEED_ID, {
        sender: "Ghost AI",
        role: "assistant",
        content,
        timestamp: Date.now(),
      }).catch(() => {}),
    [createFeedMessage]
  )

  const handledRunIdRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!run || ACTIVE_RUN_STATUSES.has(run.status)) return
    if (handledRunIdRef.current === run.id) return
    handledRunIdRef.current = run.id
    if (run.status === "COMPLETED") {
      onComplete()
      void postAssistantMessage("Ghost AI finished generating a new spec.")
    } else {
      void postAssistantMessage(`Ghost AI spec generation ${run.status.toLowerCase().replace(/_/g, " ")}.`)
    }
  }, [run, onComplete, postAssistantMessage])

  const generate = useCallback(
    async (chatHistory: ChatFeedMessageData[], nodes: CanvasNode[], edges: CanvasEdge[]) => {
      setIsStarting(true)
      try {
        const specResponse = await fetch("/api/ai/spec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, chatHistory, nodes, edges }),
        })
        if (!specResponse.ok) throw new Error("spec-request-failed")
        const { runId: newRunId } = (await specResponse.json()) as { runId: string }

        const tokenResponse = await fetch("/api/ai/spec/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: newRunId }),
        })
        if (!tokenResponse.ok) throw new Error("token-request-failed")
        const { token } = (await tokenResponse.json()) as { token: string }

        setRunId(newRunId)
        setPublicToken(token)
      } catch {
        await postAssistantMessage("Ghost AI couldn't generate a spec — please try again.")
      } finally {
        setIsStarting(false)
      }
    },
    [roomId, postAssistantMessage]
  )

  const isRunActive =
    isStarting || (run ? ACTIVE_RUN_STATUSES.has(run.status) : Boolean(runId))

  return { isRunActive, generate }
}

function AIArchitectTab({ disabled, roomId }: { disabled: boolean; roomId: string }) {
  const { messages, createFeedMessage } = useChatFeed()
  const self = useSelf()
  const senderName = self?.info?.name ?? "Anonymous"

  const [draft, setDraft] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const { isRunActive, submitPrompt } = useDesignAgentRun(roomId)
  const isBusy = disabled || isRunActive

  const sendMessage = useCallback(
    async (content: string) => {
      if (isBusy || isSending) return
      const trimmed = content.trim()
      if (!trimmed) return

      setIsSending(true)
      setSendError(null)
      try {
        await createFeedMessage(AI_CHAT_FEED_ID, {
          sender: senderName,
          role: "user",
          content: trimmed,
          timestamp: Date.now(),
        })
        setDraft("")
        await submitPrompt(trimmed)
      } catch {
        setSendError("Couldn't send your message. Try again.")
      } finally {
        setIsSending(false)
      }
    },
    [isBusy, isSending, createFeedMessage, senderName, submitPrompt]
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void sendMessage(draft)
    }
  }

  const isInputDisabled = isBusy || isSending

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 px-3 py-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
              <Bot className="h-8 w-8 text-copy-faint" />
              <p className="text-sm text-copy-muted">
                Chat with your collaborators in this room.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={isInputDisabled}
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-full bg-subtle px-3 py-1.5 text-xs text-ai-text transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-subtle"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender === senderName
              return (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    isOwnMessage
                      ? "ml-auto border-2 border-brand/50 bg-brand-dim text-copy-primary"
                      : "mr-auto border border-surface-border bg-elevated text-ai-text"
                  }`}
                >
                  <div className="mb-1 flex items-baseline gap-2 text-xs text-copy-muted">
                    <span className="font-medium text-copy-secondary">{message.sender}</span>
                    <span>{formatTimestamp(message.timestamp)}</span>
                  </div>
                  {message.content}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-surface-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message this room..."
            disabled={isInputDisabled}
            className="min-h-[72px] max-h-[160px] flex-1 resize-none bg-elevated border-surface-border text-copy-primary placeholder:text-copy-faint"
          />
          <Button
            size="icon"
            onClick={() => void sendMessage(draft)}
            disabled={isInputDisabled || !draft.trim()}
            className="h-8 w-8 shrink-0 bg-ai text-white hover:bg-ai/90"
          >
            {isInputDisabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
        {sendError ? <p className="mt-1.5 text-xs text-error">{sendError}</p> : null}
      </div>
    </div>
  )
}

function SpecListItem({
  spec,
  onPreview,
  onDownload,
}: {
  spec: ProjectSpecSummary
  onPreview: () => void
  onDownload: () => void
}) {
  return (
    <div className="rounded-2xl border border-surface-border bg-elevated p-3">
      <button type="button" onClick={onPreview} className="flex w-full items-start gap-2 text-left">
        <FileText className="h-5 w-5 shrink-0 text-ai-text" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-copy-primary">
            {getSpecFilename(spec.id)}
          </p>
          <p className="mt-1 text-xs text-copy-muted">{formatSpecDate(spec.createdAt)}</p>
        </div>
      </button>
      <div className="mt-3 flex justify-end">
        <Button variant="outline" size="sm" onClick={onDownload} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
      </div>
    </div>
  )
}

function SpecsTab({ roomId }: { roomId: string }) {
  const { specs, loading, error, refresh } = useProjectSpecs(roomId)
  const [previewSpecId, setPreviewSpecId] = useState<string | null>(null)
  const { messages: chatMessages } = useChatFeed()
  const { nodes, edges, isLoading: canvasLoading } = useLiveblocksFlow<CanvasNode, CanvasEdge>()
  const { isRunActive, generate } = useSpecGenerationRun(roomId, refresh)

  const handleGenerate = () => {
    void generate(
      chatMessages.map(({ sender, role, content, timestamp }) => ({ sender, role, content, timestamp })),
      nodes ?? [],
      edges ?? []
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
      <Button
        className="w-full gap-1.5 bg-ai text-white hover:bg-ai/90"
        onClick={handleGenerate}
        disabled={isRunActive || canvasLoading}
      >
        {isRunActive ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Generate Spec
      </Button>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-copy-muted" />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-error">{error}</p>
      ) : specs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <FileText className="h-8 w-8 text-copy-faint" />
          <p className="text-sm text-copy-muted">No specs generated yet.</p>
        </div>
      ) : (
        specs.map((spec) => (
          <SpecListItem
            key={spec.id}
            spec={spec}
            onPreview={() => setPreviewSpecId(spec.id)}
            onDownload={() => triggerSpecDownload(roomId, spec.id)}
          />
        ))
      )}

      <SpecPreviewDialog
        projectId={roomId}
        specId={previewSpecId}
        onOpenChange={(open) => !open && setPreviewSpecId(null)}
      />
    </div>
  )
}

interface AISidebarProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
}

export function AISidebar({ isOpen, onClose, roomId }: AISidebarProps) {
  const { isAIThinking, statusText } = useAIActivity()

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

      {isAIThinking || statusText ? (
        <div className="flex items-center gap-2 border-b border-surface-border bg-elevated px-4 py-2 text-xs text-ai-text">
          {isAIThinking && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />}
          <span className="truncate">{statusText ?? "Ghost AI is working…"}</span>
        </div>
      ) : null}

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
          <AIArchitectTab disabled={isAIThinking} roomId={roomId} />
        </TabsContent>

        <TabsContent value="specs" className="flex flex-1 flex-col overflow-hidden">
          <SpecsTab roomId={roomId} />
        </TabsContent>
      </Tabs>
    </aside>
  )
}
