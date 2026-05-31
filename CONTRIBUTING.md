# Contributing to ZZP Platform

Thank you for your interest in contributing. This document explains how to get
started and what we expect from contributions.

## Prerequisites

- Node.js 22+
- npm
- Git

## Getting Started

```bash
git clone https://github.com/cartonn/ZZP-Platform.git
cd ZZP-Platform
npm install
cp .env.example .env
npx prisma db push
npx prisma db seed
npm run dev
```

The app runs at `http://localhost:3000`. Demo accounts (password: `demo1234`):

| Role       | Email                            |
| ---------- | -------------------------------- |
| Freelancer | zzp@zzp-platform.local           |
| Client     | opdrachtgever@zzp-platform.local |
| Admin      | admin@zzp-platform.local         |

## Development Workflow

1. Create a branch from `main`
2. Make your changes
3. Run `npm run check` (lint + typecheck + test + build)
4. Run `npx prettier --check .` (formatting)
5. Open a pull request using the PR template

## Code Style

- **Formatting:** Prettier (enforced via pre-commit hook and CI)
- **Linting:** ESLint with Next.js + TypeScript rules
- **TypeScript:** Strict mode (`strict: true`, `noUncheckedIndexedAccess: true`)

## Testing

- **Unit tests:** Vitest — files in `src/**/*.test.ts`
- **E2E tests:** Playwright — files in `e2e/*.spec.ts`
- Run unit tests: `npm run test`
- Run e2e (local, requires Edge): `npm run e2e`

## Architecture Rules

See [CLAUDE.md](./CLAUDE.md) for the full set of rules. The key ones:

- **Server-side is the source of truth.** Never decide critical state client-side.
- **Every mutation:** auth → role → ownership → Zod validation → action → audit log.
- **Documents are private by default.** Storage via the abstraction in `src/lib/services/storage.ts`.
- **Credential status transitions** follow the explicit map in `src/lib/enums.ts`.
- **Audit everything that matters:** verification decisions, role/status changes, document access.

## Definition of Done

A task is done when:

- [ ] `npm run check` passes (lint + typecheck + test + build)
- [ ] `npx prettier --check .` passes
- [ ] Relevant e2e specs pass
- [ ] Loading, error, and empty states are present (for UI changes)
- [ ] No "AI" in any user-facing text

## Language

- **UI text:** Dutch (Nederlands)
- **Code:** English
- **Comments:** Only when the _why_ is non-obvious; no comments explaining _what_

## Pull Request Process

1. CI runs automatically (lint, typecheck, test, build, formatting, e2e)
2. A review agent provides automated feedback (advisory, non-blocking)
3. The repo owner reviews and merges

## Security

See [SECURITY.md](./SECURITY.md) for our vulnerability disclosure policy.
