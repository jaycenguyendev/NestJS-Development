Generate a production-grade monorepo with Next.js (App Router) for frontend and NestJS for backend, styled with TailwindCSS + shadcn/ui, with modern animations (Framer Motion). The code must be senior-level: clean architecture, clear folder boundaries, strict linting, tests, Docker, CI, and documentation.

Tech & Constraints

Monorepo tool: Turborepo + pnpm workspaces.

Node v20 LTS, TypeScript 5+.

Frontend: Next.js 14+ (App Router), React 18, shadcn/ui, TailwindCSS, Framer Motion.

Backend: NestJS 10+, Prisma ORM, PostgreSQL (default), Swagger/OpenAPI docs, pino logging.

Auth: NextAuth.js (credentials + OAuth provider example) or JWT with refresh tokens; share types via a @types package.

Env schema validation via zod (@/packages/config).

Testing: Jest (unit), Vitest optional for FE, Playwright (e2e FE), Supertest (API e2e).

Quality: ESLint (strict), Prettier, Husky + lint-staged, commitlint (Conventional Commits).

CI: GitHub Actions (install, lint, test, build, docker).

Containerization: Docker + docker-compose (db + services).

Internationalization: next-intl or built-in Next i18n.

A11y & performance: sensible defaults, lazy loading, image optimization.

Monorepo Layout (required)

pgsql
Copy
Edit
.
├─ apps/
│  ├─ web/            # Next.js (App Router)
│  └─ api/            # NestJS
├─ packages/
│  ├─ ui/             # shadcn/ui wrapper components, design tokens, icons
│  ├─ config/         # env loader + zod schema
│  ├─ tsconfig/       # shared tsconfigs
│  ├─ eslint-config/  # shared eslint config
│  └─ types/          # shared TypeScript types (DTOs, models)
├─ infra/
│  ├─ docker/         # Dockerfiles, compose files
│  └─ prisma/         # shared Prisma schema (or keep in api if preferred)
├─ .github/workflows/ # CI pipelines
└─ turbo.json         # pipeline definitions
Frontend Requirements (apps/web)

App Router structure with route groups: (marketing), (app); pages: /, /auth/(sign-in|sign-up), /dashboard.

Protected routes via middleware; server components where suitable, client components for interactivity.

shadcn/ui installed and configured; consistent design tokens (spacing, radius, shadows).

Tailwind theme with modern palette (e.g., emerald/teal) and Dark Mode (class strategy).

Components: AppShell (Header/Sidebar), DataTable (@tanstack/react-table v8), Form components (zod + react-hook-form), Dialog/Sheet/Toast.

Animations: page transitions, button micro-interactions, empty states using Framer Motion—subtle, performant.

State & data fetching: React Query (TanStack Query) for client queries; server actions or API routes for mutations (document choice).

Examples: a “Users” CRUD screen with search, sort, pagination, inline add/edit row, bulk delete, and toasts.

Backend Requirements (apps/api)

NestJS modular architecture: modules/{auth, users, health}, common/ (filters, guards, interceptors, dto, utils), config/.

Auth module: local credentials + (optional) Google OAuth; password hashing (argon2), refresh tokens (httpOnly).

Users module: RESTful endpoints with pagination, filters; class-validator/class-transformer DTOs; Swagger docs.

Global pipes (validation), exception filters, logging via pino, request correlation id.

Prisma setup with PostgreSQL; seed script; migrations.

CORS, rate limiting, security headers (helmet).

Cross-cutting

Env config (packages/config): single source of truth; FE/BE read from it. Fail fast on invalid env.

OpenAPI generated from Nest; optionally generate typed client for web.

Shared Types (packages/types) for DTOs and domain models.

Error handling: typed errors, error boundaries in Next.js.

Observability: basic request logging, health check endpoints (/health in api, /api/health in web proxy).

Tooling & Scripts

Root scripts: dev, build, lint, test, typecheck, format, prepare (husky), e2e.

Turborepo pipeline: cache build, lint, test. Parallel where safe.

Docker:

apps/api/Dockerfile, apps/web/Dockerfile.

infra/docker/docker-compose.yml with postgres, api, web, pgadmin.

Make sure local dev (pnpm install && pnpm dev) works out-of-the-box.

Deliverables

Full monorepo with the exact layout above.

Clear README.md at root: prerequisites, setup, env examples, commands, Docker, CI status, troubleshooting.

.env.example files for web & api; document secrets handling.

Screens:

Marketing home with modern hero, CTA, and animated cards.

Auth pages (sign in/up) with validation + toasts.

Dashboard shell with sidebar navigation.

Users CRUD page as described (with shadcn table, modals/forms, optimistic updates).

Tests:

Web: Jest (unit), Playwright (basic e2e sign-in + users flow).

API: Jest (unit), Supertest (e2e users + auth).

CI: GitHub Actions: install, lint, test, build, docker build; cache pnpm/turbo.

Quality Bar / Acceptance Criteria

Builds and runs with one command: pnpm i && pnpm dev (non-Docker) and docker compose up (Docker).

Lint passes with zero warnings; strict TS enabled; no any unless justified.

Folder boundaries respected; reusable UI in packages/ui.

A11y checks: proper labels, focus states, keyboard nav.

Performance: Code-splitting, image optimization, lazy routes; avoid blocking main thread; minimal bundle.

Docs: concise, accurate, up-to-date.

Extra (nice to have)

Storybook for packages/ui.

MSW for FE API mocking.

Feature flags scaffold.

Sentry (or hook points) for error reporting.

Generate the entire repository with code, config files, and example data. Print the final folder tree and the main commands to run locally and via Docker.