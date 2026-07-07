import { randomUUID } from "node:crypto"
import { logger, metadata, schemaTask } from "@trigger.dev/sdk"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"
import { put } from "@vercel/blob"
import { z } from "zod"
import { NODE_COLORS, NODE_SHAPES, type CanvasNodeShape } from "@/types/canvas"
import { chatFeedMessageSchema, type ChatFeedMessageData } from "@/types/tasks"
import prisma from "@/lib/prisma"

const ALLOWED_SHAPES = NODE_SHAPES.map((shape) => shape.shape) as [CanvasNodeShape, ...CanvasNodeShape[]]

export const canvasNodeSchema = z
  .object({
    id: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z
      .object({
        label: z.string(),
        color: z.string(),
        shape: z.enum(ALLOWED_SHAPES),
      })
      .loose(),
  })
  .loose()

export const canvasEdgeSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
  })
  .loose()

type CanvasNodeInput = z.infer<typeof canvasNodeSchema>
type CanvasEdgeInput = z.infer<typeof canvasEdgeSchema>

const generateSpecPayloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(chatFeedMessageSchema),
  nodes: z.array(canvasNodeSchema),
  edges: z.array(canvasEdgeSchema),
})

function colorKeyForFill(fill: string): string {
  const entry = Object.entries(NODE_COLORS).find(([, pair]) => pair.fill === fill)
  return entry?.[0] ?? "neutral"
}

function buildSpecPrompt(
  chatHistory: ChatFeedMessageData[],
  nodes: CanvasNodeInput[],
  edges: CanvasEdgeInput[]
): string {
  const nodeLines = nodes.length
    ? nodes
        .map(
          (node) =>
            `- id="${node.id}" shape=${node.data.shape} color=${colorKeyForFill(node.data.color)} label="${node.data.label}" position=(${Math.round(node.position.x)}, ${Math.round(node.position.y)})`
        )
        .join("\n")
    : "(no nodes on the canvas)"

  const edgeLines = edges.length
    ? edges.map((edge) => `- "${edge.source}" -> "${edge.target}"`).join("\n")
    : "(no connections)"

  const chatLines = chatHistory.length
    ? chatHistory.map((message) => `${message.sender} (${message.role}): ${message.content}`).join("\n")
    : "(no discussion yet)"

  return `You are Ghost AI, a system design assistant. Write a clear, well-structured Markdown technical specification for the system described by the canvas graph and conversation below.

Canvas nodes (system components):
${nodeLines}

Canvas connections (data/control flow):
${edgeLines}

Collaborator conversation (context and intent):
${chatLines}

Write the spec in Markdown with headings covering at least: Overview, Components, Data Flow, and any considerations or decisions raised in the conversation. Refer to components by their labels, not their raw ids. Return only the Markdown document — no commentary before or after it.`
}

export const generateSpec = schemaTask({
  id: "generate-spec",
  schema: generateSpecPayloadSchema,
  run: async (payload) => {
    const { projectId, roomId, chatHistory, nodes, edges } = payload

    try {
      logger.log("generate-spec started", { projectId, roomId })
      metadata.set("status", "start")

      metadata.set("status", "processing")
      const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })
      const { text } = await generateText({
        model: google("gemini-2.5-flash"),
        prompt: buildSpecPrompt(chatHistory, nodes, edges),
      })

      const specId = randomUUID()
      const blob = await put(`specs/${projectId}/${specId}.md`, text, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "text/markdown",
      })
      await prisma.projectSpec.create({
        data: { id: specId, projectId, filePath: blob.url },
      })

      metadata.set("status", "complete")
      logger.log("generate-spec completed", { projectId, roomId, specId, length: text.length })

      return { specId, markdown: text }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Spec generation ran into an unexpected error."
      metadata.set("status", "error")
      logger.error("generate-spec failed", { projectId, roomId, error: message })
      throw error
    }
  },
})
