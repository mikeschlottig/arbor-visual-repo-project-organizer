# Arbor — Visual Repo & Project Organizer

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/mikeschlottig/arbor-visual-repo-project-organizer)

## Overview

Arbor is a visually stunning, Cloudflare Workers + Durable Objects powered application for organizing repositories of folders, documents, images, video, code, and projects. It models repository concepts similar to Git (repositories, branches, commits, file trees, tags, issues, pull requests), but optimized for rich visual browsing, fast metadata operations at the edge, and easy local-first sync (local SQL vs Cloudflare D1). The product is built with shadcn/ui primitives and Tailwind, leveraging a modern React frontend with Hono backend routes. Arbor is AI-friendly and extensible — metadata and file-tree snapshots are designed to be passed to ML models or indexing pipelines.

This project emphasizes rapid development with a focus on visual excellence, responsive design, and seamless integration between local storage and cloud persistence. It supports tagging, date stamps (e.g., "created on dd-mm-yy--timestamp"), and a GitHub-like structure for branching, merging, versioning, issues, and pull requests.

### Key Features
- **Visual Repository Management**: Interactive file trees, branch selectors, commit history, and previews for code, images, videos, and documents.
- **Git-Inspired Workflows**: Create branches, commits (metadata snapshots), issues, and pull requests with visual merge previews and conflict indicators.
- **Responsive UI**: Mobile-first design with shadcn/ui components, Tailwind CSS, and framer-motion for smooth micro-interactions.
- **Storage Abstraction**: Pluggable adapters for local SQL (sql.js/IndexedDB), Cloudflare D1, or Durable Objects; includes sync approval flows.
- **AI-Ready Extensibility**: Export JSON metadata for indexing; supports embedding/search integrations in future phases.
- **Visual Excellence**: Gradient hero sections, card-based repo overviews, kanban-style issue boards, and professional typography/spacing.
- **Core Views**:
  - Home/Repos Overview: Grid of repository cards with search, filters, and create CTA.
  - Repo Explorer: Two-column layout with file tree, branch/commit selectors, and file previews.
  - Issues & Pull Requests: Kanban boards and PR tables with creation/editing flows.
  - Settings & Storage Sync: Modal for storage preferences and sync approvals.

Color palette: Primary (#F38020), Accent (#4F46E5), Background (#0F172A).

## Technology Stack
- **Frontend**: React 18, React Router 6, TypeScript, shadcn/ui, Tailwind CSS v3 + Animate, Lucide React (icons), Framer Motion (animations), Zustand (state management), TanStack React Query (data fetching), Recharts (visualizations), Sonner (toasts), date-fns (formatting).
- **Backend**: Hono (routing), Cloudflare Workers, Durable Objects (via core-utils library for entity-based persistence).
- **Storage & Utils**: IndexedDB/sql.js (local), Cloudflare D1 (cloud), UUID (IDs), Immer (immutability).
- **Dev Tools**: Vite (build), Bun (runtime/package manager), ESLint + TypeScript (linting/type safety), Wrangler (Cloudflare deployment).
- **Drag & Drop**: @dnd-kit/core + sortable.
- **Other**: React Hook Form + Zod (forms/validation), React Syntax Highlighter/PrismJS (code previews, optional).

The project follows a phases-based roadmap: Phase 1 establishes a demoable frontend foundation with DO-backed APIs; subsequent phases add storage adapters, collaboration, and AI integrations.

## Quick Start

### Prerequisites
- [Bun](https://bun.sh/) installed (version 1.0+ recommended).
- Node.js (for some dev tools, but Bun is primary).
- A Cloudflare account (free tier sufficient for development/deployment).

### Installation
1. Clone the repository:
   ```
   git clone <your-repo-url>
   cd arbor-repo
   ```

2. Install dependencies using Bun:
   ```
   bun install
   ```

3. Generate Cloudflare Worker types (if needed):
   ```
   bun run cf-typegen
   ```

### Local Development
1. Start the development server:
   ```
   bun run dev
   ```
   The app will be available at `http://localhost:3000` (or the port specified in your environment).

2. In a separate terminal, you can preview the built app:
   ```
   bun run preview
   ```

3. Lint the codebase:
   ```
   bun run lint
   ```

### Building for Production
Build the frontend assets:
```
bun run build
```
The output will be in the `dist/` directory, ready for Cloudflare deployment.

## Usage
- **Home/Repos Overview**: Browse and search repositories. Create new repos via the CTA button (opens a shadcn/ui Sheet for name, description, and default branch).
- **Repo Explorer**: Select a repo to view the file tree. Switch branches, inspect commits, and preview files (code syntax highlighting, image/video embeds).
- **Issues & PRs**: Create issues with tags/links; initiate PRs between branches with merge previews.
- **Settings**: Access via the sidebar or global menu to configure storage (local SQL vs D1) and sync preferences. Approvals are required for data sync.
- **API Endpoints**: Interact via `/api/repos`, `/api/branches`, `/api/commits`, etc. (documented in `worker/user-routes.ts`). Use the provided `api-client.ts` for frontend calls.
- **Mock Data**: Initial data is seeded from `shared/mock-data.ts` (repos, branches, files). Replace with real entities in production.

Example API call (from frontend):
```tsx
import { api } from '@/lib/api-client';

// Fetch repos
const repos = await api<{ items: Repo[]; next: string | null }>('/api/repos');
```

For local-first mode (Phase 2+): Toggle storage in settings; sync operations queue changes with user approval.

## Development Guidelines
- **Frontend**: Edit pages in `src/pages/` (e.g., rewrite `HomePage.tsx` for repos overview). Use shadcn/ui components from `src/components/ui/`. Follow UI non-negotiables: Root wrappers with gutters, Tailwind v3-safe utilities, responsive design (mobile-first).
- **Backend**: Add entities in `worker/entities.ts` (extend `IndexedEntity`). Implement routes in `worker/user-routes.ts` using helpers like `ok()`, `bad()`. Never modify `worker/core-utils.ts` or `worker/index.ts`.
- **Shared Types**: Define in `shared/types.ts` for type safety across frontend/backend.
- **State Management**: Use Zustand with primitive selectors only (avoid object destructuring in selectors to prevent re-render loops).
- **Visual Excellence**: Ensure hover states, transitions (framer-motion), and loading skeletons. Test responsiveness across breakpoints.
- **Phased Development**: Follow the roadmap—Phase 1: Frontend + core APIs; Phase 2: Storage adapters; Phase 3: PRs/collaboration; Phase 4: AI/search.
- **Testing**: Run `bun run lint` for checks. Use TanStack Query for optimistic updates and error handling.
- **Avoid**: Direct Durable Object access, new bindings in `wrangler.jsonc`, or unlisted dependencies.

Contribute by opening issues or PRs. Focus on extensibility for AI integrations and blob storage.

## Deployment
Deploy to Cloudflare Workers for edge performance and global distribution. The project is pre-configured with Wrangler.

1. Install Wrangler CLI globally (if not already):
   ```
   bun add -g wrangler
   ```

2. Authenticate with Cloudflare:
   ```
   wrangler login
   ```

3. Build and deploy:
   ```
   bun run deploy
   ```
   This builds the frontend and deploys the Worker. Your app will be live at `<project-name>.workers.dev`.

4. For custom domains or advanced config: Edit `wrangler.jsonc` (but avoid changing bindings/migrations).

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/mikeschlottig/arbor-visual-repo-project-organizer)

### Environment Variables
No custom vars needed initially; Durable Objects handle state. For production, set secrets via `wrangler secret put <KEY>`.

## License
MIT License. See [LICENSE](LICENSE) for details (create if absent). 

For support, check Cloudflare Workers docs or open a GitHub issue.