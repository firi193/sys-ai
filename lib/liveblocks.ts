import { Liveblocks } from "@liveblocks/node"

const CURSOR_COLORS = [
  "#F87171",
  "#FB923C",
  "#FBBF24",
  "#A3E635",
  "#34D399",
  "#22D3EE",
  "#60A5FA",
  "#A78BFA",
  "#F472B6",
]

declare global {
  // eslint-disable-next-line no-var
  var liveblocks: Liveblocks | undefined
}

export function getLiveblocksClient(): Liveblocks {
  if (!global.liveblocks) {
    global.liveblocks = new Liveblocks({
      secret: process.env.LIVEBLOCKS_SECRET_KEY ?? "",
    })
  }
  return global.liveblocks
}

export function getCursorColorForUser(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length
  return CURSOR_COLORS[index]
}
