// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
import type { RoomFeedMessageData } from "@/types/tasks"

declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: Record<string, never>;

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: {
      type: "ai-status";
      runId: string;
      status: "start" | "processing" | "complete" | "error";
      message: string;
    };

    // Custom message payload for a room's feeds, for useFeedMessages, useCreateFeedMessage.
    // ai-status-feed and ai-chat are separate feeds with separate message shapes (see
    // types/tasks.ts) — RoomFeedMessageData is the shared envelope type both narrow from.
    FeedMessageData: RoomFeedMessageData;

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: Record<string, never>;

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: Record<string, never>;
  }
}

export {};
