import { z } from "zod"

export const AI_STATUS_FEED_ID = "ai-status-feed"

export interface AIStatusFeedMessageData {
  text?: string
}

export function isAIStatusFeedMessageData(value: unknown): value is AIStatusFeedMessageData {
  if (typeof value !== "object" || value === null) return false
  const text = (value as Record<string, unknown>).text
  return text === undefined || typeof text === "string"
}

export const AI_CHAT_FEED_ID = "ai-chat"

export interface ChatFeedMessageData {
  sender: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

// `satisfies` keeps this schema in sync with ChatFeedMessageData at compile time.
export const chatFeedMessageSchema = z.object({
  sender: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number(),
}) satisfies z.ZodType<ChatFeedMessageData>

export function isChatFeedMessageData(value: unknown): value is ChatFeedMessageData {
  return chatFeedMessageSchema.safeParse(value).success
}

// Liveblocks types FeedMessageData as a single global shape shared by every feed in a
// room (see liveblocks.config.ts) — a real union of AIStatusFeedMessageData | ChatFeedMessageData
// there fails Liveblocks' Json-value constraint check. Widening every feed's fields to
// optional keeps the envelope a valid Json object; each feed's own type guard
// (isAIStatusFeedMessageData / isChatFeedMessageData) narrows a message's `data` down to
// its feed-specific shape before it's trusted.
export interface RoomFeedMessageData {
  text?: string
  sender?: string
  role?: "user" | "assistant"
  content?: string
  timestamp?: number
}
