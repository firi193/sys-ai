import { logger, task } from "@trigger.dev/sdk"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject, NoObjectGeneratedError } from "ai"
import { z } from "zod"
import { mutateFlow, type MutableFlow } from "@liveblocks/react-flow/node"
import { getLiveblocksClient } from "@/lib/liveblocks"
import {
  DEFAULT_NODE_COLOR,
  NODE_COLORS,
  NODE_SHAPES,
  MIN_NODE_SIZE,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
} from "@/types/canvas"

interface DesignAgentPayload {
  prompt: string
  roomId: string
}

const AI_PRESENCE_USER_ID = "ghost-ai"
const AI_PRESENCE_NAME = "Ghost AI"
const AI_PRESENCE_COLOR = "#6457f9"
const AI_PRESENCE_TTL_SECONDS = 90
const AI_PRESENCE_CLEAR_TTL_SECONDS = 2

const ALLOWED_SHAPES = NODE_SHAPES.map((shape) => shape.shape) as [CanvasNodeShape, ...CanvasNodeShape[]]
const ALLOWED_COLORS = Object.keys(NODE_COLORS) as [string, ...string[]]

const positionSchema = z.object({ x: z.number(), y: z.number() })
const sizeSchema = z.object({ width: z.number(), height: z.number() })

const ACTION_TYPES = [
  "addNode",
  "moveNode",
  "resizeNode",
  "updateNodeData",
  "deleteNode",
  "addEdge",
  "deleteEdge",
] as const

// Gemini's structured-output support for zod discriminatedUnion/anyOf schemas is unreliable —
// it frequently returns objects that don't match any branch, which fails schema validation
// after generation. A single flat schema is compatible with Gemini's response schema support;
// per-type shape is enforced by toDesignAction below. Fields use .nullable() rather than
// .optional() because Gemini's structured-output mode requires every property to be present —
// optional fields are silently dropped instead of populated, even when they're required for
// a given action type.
const flatActionSchema = z.object({
  type: z.enum(ACTION_TYPES),
  id: z.string().min(1).max(80),
  shape: z.enum(ALLOWED_SHAPES).nullable(),
  color: z.enum(ALLOWED_COLORS).nullable(),
  label: z.string().min(1).max(60).nullable(),
  position: positionSchema.nullable(),
  size: sizeSchema.nullable(),
  source: z.string().min(1).nullable(),
  target: z.string().min(1).nullable(),
})

const designResponseSchema = z.object({ actions: z.array(flatActionSchema) })

type FlatAction = z.infer<typeof flatActionSchema>

type DesignAction =
  | { type: "addNode"; id: string; shape: CanvasNodeShape; color: string; label: string; position: { x: number; y: number } }
  | { type: "moveNode"; id: string; position: { x: number; y: number } }
  | { type: "resizeNode"; id: string; size: { width: number; height: number } }
  | { type: "updateNodeData"; id: string; label?: string; color?: string }
  | { type: "deleteNode"; id: string }
  | { type: "addEdge"; id: string; source: string; target: string }
  | { type: "deleteEdge"; id: string }

function toDesignAction(raw: FlatAction): DesignAction {
  switch (raw.type) {
    case "addNode":
      if (!raw.shape || !raw.color || !raw.label || !raw.position) {
        throw new Error(`addNode action "${raw.id}" is missing shape, color, label, or position`)
      }
      return { type: "addNode", id: raw.id, shape: raw.shape, color: raw.color, label: raw.label, position: raw.position }
    case "moveNode":
      if (!raw.position) throw new Error(`moveNode action "${raw.id}" is missing position`)
      return { type: "moveNode", id: raw.id, position: raw.position }
    case "resizeNode":
      if (!raw.size) throw new Error(`resizeNode action "${raw.id}" is missing size`)
      return { type: "resizeNode", id: raw.id, size: raw.size }
    case "updateNodeData":
      return { type: "updateNodeData", id: raw.id, label: raw.label ?? undefined, color: raw.color ?? undefined }
    case "deleteNode":
      return { type: "deleteNode", id: raw.id }
    case "addEdge":
      if (!raw.source || !raw.target) throw new Error(`addEdge action "${raw.id}" is missing source or target`)
      return { type: "addEdge", id: raw.id, source: raw.source, target: raw.target }
    case "deleteEdge":
      return { type: "deleteEdge", id: raw.id }
  }
}

type AIStatus = "start" | "processing" | "complete" | "error"

function colorKeyForFill(fill: string): string {
  const entry = Object.entries(NODE_COLORS).find(([, pair]) => pair.fill === fill)
  return entry?.[0] ?? "neutral"
}

function getNodeSize(node: CanvasNode): { width: number; height: number } {
  const styleWidth = typeof node.style?.width === "number" ? node.style.width : undefined
  const styleHeight = typeof node.style?.height === "number" ? node.style.height : undefined
  const width = node.width ?? styleWidth
  const height = node.height ?? styleHeight
  if (width && height) return { width, height }
  return NODE_SHAPES.find((shape) => shape.shape === node.data.shape)?.defaultSize ?? MIN_NODE_SIZE
}

function buildPrompt(prompt: string, nodes: CanvasNode[], edges: CanvasEdge[]): string {
  const nodeLines = nodes.length
    ? nodes
        .map((node) => {
          const size = getNodeSize(node)
          return `- id="${node.id}" shape=${node.data.shape} color=${colorKeyForFill(node.data.color)} label="${node.data.label}" position=(${Math.round(node.position.x)}, ${Math.round(node.position.y)}) size=${size.width}x${size.height}`
        })
        .join("\n")
    : "(none — the canvas is empty)"

  const edgeLines = edges.length
    ? edges.map((edge) => `- id="${edge.id}" source="${edge.source}" target="${edge.target}"`).join("\n")
    : "(none)"

  return `You are Ghost AI, a system design assistant. Translate the user's request into a list of canvas actions that update a collaborative architecture diagram.

Current nodes on the canvas:
${nodeLines}

Current edges on the canvas:
${edgeLines}

Rules:
- Only use these node shapes: ${ALLOWED_SHAPES.join(", ")}.
- Only use these node colors: ${ALLOWED_COLORS.join(", ")}.
- Space new nodes at least 220px apart horizontally and 140px apart vertically, and do not overlap the positions of existing nodes listed above.
- Arrange related nodes in a clear left-to-right or top-to-bottom flow.
- Reference existing node/edge ids exactly when moving, resizing, updating, deleting, or connecting them.
- Invent short, unique, kebab-case ids (e.g. "auth-service", "orders-db") for new nodes and edges.
- Only include actions needed to satisfy the request — do not recreate nodes/edges that already exist and don't need to change.

Every action object has all of these fields: type, id, shape, color, label, position, size, source, target.
Set each field to its real value ONLY when it's required for that action's "type" (see below); set it to null for every other field. Never omit a field.
- addNode requires: shape, color, label, position (size, source, target null)
- moveNode requires: position (all others null)
- resizeNode requires: size (all others null)
- updateNodeData requires: at least one of label or color (all others null)
- deleteNode requires: nothing else (all others null)
- addEdge requires: source, target (all others null)
- deleteEdge requires: nothing else (all others null)

User request: "${prompt}"`
}

function applyDesignActions(flow: MutableFlow<CanvasNode, CanvasEdge>, actions: DesignAction[]): void {
  for (const action of actions) {
    switch (action.type) {
      case "addNode": {
        const size = NODE_SHAPES.find((shape) => shape.shape === action.shape)?.defaultSize ?? MIN_NODE_SIZE
        const color = NODE_COLORS[action.color] ?? DEFAULT_NODE_COLOR
        const node: CanvasNode = {
          id: action.id,
          type: "canvasNode",
          position: action.position,
          data: { label: action.label, color: color.fill, shape: action.shape },
          style: { width: size.width, height: size.height },
        }
        flow.addNode(node)
        break
      }
      case "moveNode":
        flow.updateNode(action.id, { position: action.position })
        break
      case "resizeNode": {
        const width = Math.max(action.size.width, MIN_NODE_SIZE.width)
        const height = Math.max(action.size.height, MIN_NODE_SIZE.height)
        flow.updateNode(action.id, { style: { width, height }, width, height })
        break
      }
      case "updateNodeData": {
        const partial: { label?: string; color?: string } = {}
        if (action.label !== undefined) partial.label = action.label
        if (action.color !== undefined) partial.color = (NODE_COLORS[action.color] ?? DEFAULT_NODE_COLOR).fill
        flow.updateNodeData(action.id, partial)
        break
      }
      case "deleteNode":
        flow.removeNode(action.id)
        break
      case "addEdge":
        flow.addEdge({ id: action.id, source: action.source, target: action.target })
        break
      case "deleteEdge":
        flow.removeEdge(action.id)
        break
    }
  }
}

export const designAgent = task({
  id: "design-agent",
  run: async (payload: DesignAgentPayload, { ctx }) => {
    const { prompt, roomId } = payload
    const runId = ctx.run.id
    const client = getLiveblocksClient()

    const publishStatus = (status: AIStatus, message: string) =>
      client.broadcastEvent(roomId, { type: "ai-status", runId, status, message })

    const setPresence = (thinking: boolean, cursor: { x: number; y: number } | null, ttl: number) =>
      client.setPresence(roomId, {
        userId: AI_PRESENCE_USER_ID,
        data: { cursor, thinking },
        userInfo: { name: AI_PRESENCE_NAME, color: AI_PRESENCE_COLOR },
        ttl,
      })

    try {
      logger.log("design-agent started", { roomId, prompt })
      await publishStatus("start", "Ghost AI is reading your request…")
      await setPresence(true, null, AI_PRESENCE_TTL_SECONDS)

      let currentNodes: CanvasNode[] = []
      let currentEdges: CanvasEdge[] = []
      await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
        currentNodes = [...flow.nodes]
        currentEdges = [...flow.edges]
      })

      await publishStatus("processing", "Ghost AI is designing the architecture…")

      const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })
      const { object } = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: designResponseSchema,
        prompt: buildPrompt(prompt, currentNodes, currentEdges),
      }).catch((error) => {
        if (NoObjectGeneratedError.isInstance(error)) {
          logger.error("design-agent generateObject returned invalid output", {
            roomId,
            rawText: error.text,
            finishReason: error.finishReason,
          })
        }
        throw error
      })

      const actions = object.actions.map(toDesignAction)

      const firstPosition = actions.find(
        (action): action is Extract<DesignAction, { position: { x: number; y: number } }> =>
          "position" in action
      )?.position
      await setPresence(true, firstPosition ?? null, AI_PRESENCE_TTL_SECONDS)

      await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
        applyDesignActions(flow, actions)
      })

      await publishStatus("complete", `Ghost AI made ${actions.length} change(s) to the canvas.`)
      logger.log("design-agent completed", { roomId, actionCount: actions.length })

      return { roomId, actionCount: actions.length }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ghost AI ran into an unexpected error."
      logger.error("design-agent failed", { roomId, error: message })
      await publishStatus("error", message).catch(() => {})
      throw error
    } finally {
      await setPresence(false, null, AI_PRESENCE_CLEAR_TTL_SECONDS).catch(() => {})
    }
  },
})
