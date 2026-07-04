import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getCursorColorForUser, getLiveblocksClient } from "@/lib/liveblocks"
import { getCurrentUserIdentity, getProjectWithAccess } from "@/lib/project-access"

export async function POST(request: Request) {
  const identity = await getCurrentUserIdentity()
  if (!identity) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const roomId = typeof body?.room === "string" ? body.room : null
  if (!roomId) {
    return NextResponse.json({ message: "Missing room" }, { status: 400 })
  }

  const project = await getProjectWithAccess(roomId, identity)
  if (!project) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const liveblocks = getLiveblocksClient()
  await liveblocks.getOrCreateRoom(roomId, { defaultAccesses: [] })

  const user = await currentUser()
  const name = user?.fullName ?? user?.username ?? identity.email ?? "Anonymous"
  const avatar = user?.imageUrl ?? ""
  const color = getCursorColorForUser(identity.userId)

  const session = liveblocks.prepareSession(identity.userId, {
    userInfo: { name, avatar, color },
  })
  session.allow(roomId, session.FULL_ACCESS)

  const { status, body: responseBody } = await session.authorize()
  return new NextResponse(responseBody, { status })
}
