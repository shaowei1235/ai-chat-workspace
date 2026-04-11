# AGENTS.md

## Project Positioning

AI Chat Workspace is a step-by-step interview and learning project.

Primary goals:

- Build a clean, explainable AI chat workspace product incrementally
- Practice modern Next.js App Router development with TypeScript and Tailwind CSS
- Keep the codebase understandable for a frontend engineer transitioning into React and full-stack workflows
- Favor maintainability and interview clarity over premature abstraction

## Current Baseline

The current project baseline is intentionally small.

Already in use:

- Next.js App Router
- TypeScript
- Tailwind CSS

Not part of the baseline yet:

- Database
- Authentication
- AI integration
- Global state library
- UI component library

Do not introduce later-stage technologies unless the requested step explicitly needs them.

## Working Principles

- Only complete the step that was requested
- Keep changes small, focused, and reversible
- Prefer fewer file changes when possible
- Keep the project runnable after each step
- Prefer clear structure over clever abstractions
- Explain why new files are necessary before creating them

## Next.js Guidance

- Prefer Server Components by default
- Use Client Components only when interaction or browser-only APIs require them
- Follow App Router conventions for routing, layouts, and file placement
- Avoid mixing server concerns directly into presentational UI files

## TypeScript Guidance

- Avoid `any`
- Keep public types explicit when they affect props, shared data, or module boundaries
- Prefer simple domain naming that is easy to explain later

## Structure Guidance

- `src/components`: shared presentational building blocks
- `src/features`: feature-oriented modules
- `src/lib`: shared utilities and integration helpers
- `src/types`: shared TypeScript definitions
- `src/i18n`: future internationalization entry points and message resources

Do not over-expand the directory tree before real usage justifies it.

## UI Guidance

- Use `DESIGN.md` as a visual reference, not as a strict implementation checklist
- Keep the UI minimal, calm, and product-oriented
- Avoid template-like clutter and unnecessary motion
- Do not build polished product surfaces before the relevant step asks for them

## Internationalization Guidance

This project must support:

- `zh-CN`
- `ja`

Current expectation:

- Keep structure compatible with future multilingual support
- Avoid locking the project into a single-language-only architecture

Do not force full i18n implementation before the relevant step begins.
