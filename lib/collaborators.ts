import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export interface CollaboratorProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export async function listCollaboratorsWithProfiles(projectId: string): Promise<CollaboratorProfile[]> {
  const collaborators = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  if (collaborators.length === 0) return [];

  const emails = collaborators.map((c) => c.email);
  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({ emailAddress: emails });

  const profileByEmail = new Map<string, { name: string | null; avatarUrl: string | null }>();
  for (const user of users) {
    const matched = user.emailAddresses.find((e) =>
      emails.some((email) => email.toLowerCase() === e.emailAddress.toLowerCase())
    );
    if (!matched) continue;
    profileByEmail.set(matched.emailAddress.toLowerCase(), {
      name: user.fullName,
      avatarUrl: user.hasImage ? user.imageUrl : null,
    });
  }

  return collaborators.map((c) => {
    const profile = profileByEmail.get(c.email.toLowerCase());
    return {
      id: c.id,
      email: c.email,
      name: profile?.name ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
    };
  });
}
