"use client"

import { UserButton, useUser } from "@clerk/nextjs"
import { useOthers } from "@liveblocks/react"

const MAX_VISIBLE_AVATARS = 5
const AVATAR_SIZE_CLASS = "h-8 w-8"

const USER_BUTTON_APPEARANCE = {
  elements: {
    userButtonAvatarBox: AVATAR_SIZE_CLASS,
  },
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function PresenceAvatars() {
  const { user } = useUser()
  const others = useOthers()

  const collaborators = others.filter((other) => other.id !== user?.id)
  const visible = collaborators.slice(0, MAX_VISIBLE_AVATARS)
  const overflowCount = collaborators.length - visible.length

  return (
    <div className="pointer-events-none absolute top-4 right-4 z-20 flex items-center">
      {collaborators.length > 0 && (
        <>
          <div className="pointer-events-auto flex items-center -space-x-2">
            {visible.map((other) => {
              const name = other.info?.name ?? "Anonymous"
              const avatar = other.info?.avatar

              return (
                <div
                  key={other.connectionId}
                  title={name}
                  className={`flex ${AVATAR_SIZE_CLASS} shrink-0 items-center justify-center overflow-hidden rounded-full bg-elevated text-xs font-medium text-copy-secondary ring-2 ring-base`}
                >
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span>{getInitials(name)}</span>
                  )}
                </div>
              )
            })}

            {overflowCount > 0 && (
              <div
                className={`flex ${AVATAR_SIZE_CLASS} shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-medium text-copy-muted ring-2 ring-base`}
              >
                +{overflowCount}
              </div>
            )}
          </div>

          <div className="mx-3 h-6 w-px bg-surface-border" />
        </>
      )}

      <div className="pointer-events-auto">
        <UserButton appearance={USER_BUTTON_APPEARANCE} />
      </div>
    </div>
  )
}
