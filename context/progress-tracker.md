# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1: Foundation

## Current Goal

- Move to the next feature spec.

## Completed

- Feature spec 01: Design system — shadcn/ui initialized, all 7 UI primitives added (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea), lucide-react installed, lib/utils.ts with cn() created, globals.css updated with full dark theme token set.
- Feature spec 02: Editor chrome — `components/editor/editor-navbar.tsx` (fixed h-12 navbar, sidebar toggle with PanelLeftOpen/PanelLeftClose, left/center/right sections, dark bg + bottom border) and `components/editor/project-sidebar.tsx` (floating overlay z-50, slides from left without pushing content, Projects header + close button, My Projects / Shared tabs with empty placeholders, full-width New Project button). Dialog pattern ready via existing shadcn Dialog component and globals.css tokens.
- Feature spec 03: Auth — `proxy.ts` at project root wires Clerk middleware (all routes protected except public sign-in/sign-up paths from env vars); `ClerkProvider` wraps root layout with `@clerk/ui` dark theme and CSS variable overrides (no hardcoded colors); `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx` use two-panel layout (left: logo + tagline + feature list, hidden on small screens; right: Clerk form); root `/` redirects authenticated users to `/editor` and unauthenticated to `/sign-in`; `UserButton` added to editor navbar right section. `@clerk/ui` installed.
- Feature spec 04: Project dialogs — `hooks/use-project-dialogs.ts` manages dialog/form/loading state; `components/editor/project-dialogs-context.tsx` provides context to layout tree; `CreateProjectDialog` (name input + live slug preview), `RenameProjectDialog` (prefilled, auto-focus, Enter submits), `DeleteProjectDialog` (destructive confirm, no input) added to editor layout; sidebar updated with rename/delete actions on owned projects (hidden for shared), mobile backdrop scrim via `md:hidden` overlay; editor home screen (`app/editor/page.tsx`) shows heading, description, and New Project button wired to Create dialog. Mock project data only.
- Feature spec 05: Prisma data models — `prisma/models/project.prisma` defines `Project` (ownerId→Clerk, name, optional description, `DRAFT`/`ARCHIVED` status, `canvasJsonPath`, timestamps, indexes on ownerId+createdAt) and `ProjectCollaborator` (project FK cascade delete, email, createdAt, unique on projectId+email, indexes on email and projectId+date). `lib/prisma.ts` exports a cached singleton: branches on DATABASE_URL prefix (`prisma+postgres://` → `accelerateUrl`, otherwise `@prisma/adapter-pg`). Client generated to `app/generated/prisma`. Migration pending database connectivity.
- Feature spec 06: Project APIs — `app/api/projects/route.ts` (GET lists owner's projects ordered by createdAt desc; POST creates with defaulted name "Untitled Project"); `app/api/projects/[projectId]/route.ts` (PATCH renames, DELETE deletes). Both mutation routes enforce 401 for unauthenticated and 403 for non-owner. `npm run build` passes.
- Feature spec 07: Wire editor home — `lib/data/projects.ts` server-side helper fetches owned projects (by ownerId) and shared projects (by collaborator email via `currentUser()`); `app/editor/layout.tsx` converted to async server component, fetches project lists and passes to `EditorShell`; `components/editor/editor-shell.tsx` client shell holds sidebar toggle state and provides `ProjectDialogsContext`; `hooks/use-project-actions.ts` manages dialog state and mutations (create: slugify + unique suffix → roomId → POST /api/projects → navigate; rename: PATCH → refresh; delete: DELETE → redirect if active workspace else refresh); `POST /api/projects` updated to accept optional client-generated `id`; `app/editor/page.tsx` converted to server component using `NewProjectButton` client leaf; dialogs wired to real handlers with loading states. `npm run build` passes.

## In Progress

- None.

## Next Up

- Feature spec 08 (TBD — next spec in context/feature-specs/).

## Open Questions

- None yet.

## Architecture Decisions

- Dark-only theme: all shadcn component variables set in `:root` to dark values — no `.dark` class needed.
- CSS custom properties in globals.css serve two layers: shadcn variables (--background, --primary, etc.) and project tokens (--bg-base, --accent-primary, etc.).
- Tailwind @theme inline maps both layers to utility classes: bg-base, text-copy-primary, border-surface-border, text-brand, bg-brand-dim, etc.
- shadcn/ui components live in components/ui/ and must not be modified after generation.

## Session Notes

- Project uses Next.js 16.2.9, React 19, Tailwind v4, TypeScript strict mode.
- Path alias @/* maps to project root.
- VS Code shows @apply warnings in globals.css — these are CSS lint false positives, not build errors.
