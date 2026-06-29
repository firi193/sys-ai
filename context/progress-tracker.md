# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1: Foundation

## Current Goal

- Move to the next feature spec.

## Completed

- Feature spec 01: Design system — shadcn/ui initialized, all 7 UI primitives added (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea), lucide-react installed, lib/utils.ts with cn() created, globals.css updated with full dark theme token set.
- Feature spec 02: Editor chrome — `components/editor/editor-navbar.tsx` (fixed h-12 navbar, sidebar toggle with PanelLeftOpen/PanelLeftClose, left/center/right sections, dark bg + bottom border) and `components/editor/project-sidebar.tsx` (floating overlay z-50, slides from left without pushing content, Projects header + close button, My Projects / Shared tabs with empty placeholders, full-width New Project button). Dialog pattern ready via existing shadcn Dialog component and globals.css tokens.

## In Progress

- None.

## Next Up

- Feature spec 03 (TBD — next spec in context/feature-specs/).

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
