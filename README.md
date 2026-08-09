<div align="center">

# 🧠 BrainOS

**Your personal operating system for work and life.**

Notes · Tasks · Goals · Journal · Projects · Knowledge · Calendar · Files · AI · and more — in one calm, fast, dark-first workspace.

</div>

---

BrainOS is a modern personal knowledge & productivity platform. This repository
currently contains the **production-ready foundation**: the application shell,
navigation, design system, providers, and data-layer scaffolding. Individual
modules (Notes, Tasks, …) are routable placeholders, ready to be built.

## ✨ Highlights

- **Dark-first, beautiful UI** inspired by Linear, Raycast, Arc, Notion, and Vercel.
- **App shell** — responsive sidebar, top bar, and a global ⌘K command palette.
- **Design system** on [shadcn/ui](https://ui.shadcn.com) (Radix primitives) + Tailwind v4 OKLCH tokens.
- **Clean, feature-based architecture** built to scale to dozens of modules.
- **Type-safe from end to end** — TypeScript (strict), Zod-validated env, typed routes.
- **Data layer ready** — Supabase (SSR) clients and TanStack Query configured.

## 🧱 Tech stack

| Concern           | Choice                                             |
| ----------------- | -------------------------------------------------- |
| Framework         | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Language          | [TypeScript](https://www.typescriptlang.org) (strict) |
| UI                | [React 19](https://react.dev)                      |
| Styling           | [Tailwind CSS v4](https://tailwindcss.com)         |
| Components        | [shadcn/ui](https://ui.shadcn.com) (Radix)         |
| Icons             | [Lucide](https://lucide.dev)                       |
| Data (server)     | [Supabase](https://supabase.com) (`@supabase/ssr`) |
| Data (client)     | [TanStack Query](https://tanstack.com/query)       |
| Forms             | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Theming           | [next-themes](https://github.com/pacocoursey/next-themes) |
| Toasts            | [Sonner](https://sonner.emilkowal.ski)             |

## 🚀 Getting started

**Prerequisites:** Node.js `>= 20.9`.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional for the foundation)
cp .env.example .env.local   # then fill in Supabase values

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to
`/dashboard`.

> Supabase is optional to run the foundation. Until it's configured, the
> dashboard shows a "Connect your database" hint and data features stay dormant.

## 📜 Scripts

| Script              | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start the dev server (Turbopack).        |
| `npm run build`     | Production build (also type-checks).     |
| `npm run start`     | Serve the production build.              |
| `npm run lint`      | Run ESLint.                              |
| `npm run typecheck` | Type-check without emitting.             |
| `npm run format`    | Format with Prettier.                    |

## 🗂️ Project structure

```
src/
├── app/                    # Routes (thin) — App Router
│   ├── (app)/              # Authenticated app shell + module routes
│   ├── layout.tsx          # Root layout: fonts, metadata, providers
│   └── globals.css         # Design tokens (OKLCH) + base styles
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # Shell: sidebar, topbar, command palette…
│   └── shared/             # Reusable app components
├── config/                 # Static config (site, navigation registry)
├── features/               # Feature modules (business logic) — see its README
├── hooks/                  # Shared React hooks
├── lib/                    # Utilities, env, Supabase clients
├── providers/              # Client providers (theme, query, tooltips, toasts)
└── types/                  # Shared types
```

See [`docs/architecture.md`](docs/architecture.md) for the full picture and
[`CLAUDE.md`](CLAUDE.md) for the coding standards every contribution follows.

## 🗺️ Roadmap

Module delivery order and milestones live in
[`docs/roadmap.md`](docs/roadmap.md).

## 📄 License

Private / personal project.
