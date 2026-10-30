---
kind: frontend_style
name: 'Next.js Frontend Styling: Tailwind CSS v4 + shadcn/ui (New York) + Radix Primitives'
category: frontend_style
scope:
    - '**'
source_files:
    - apps/frontend/app/globals.css
    - apps/frontend/components.json
    - apps/frontend/postcss.config.mjs
    - apps/frontend/package.json
    - apps/frontend/components/ui/button.tsx
    - apps/frontend/components/ui/alert.tsx
    - apps/frontend/components/ui/badge.tsx
    - apps/frontend/components/ui/sidebar.tsx
    - apps/frontend/components/ui/button-group.tsx
    - apps/frontend/hooks/use-media-query.ts
    - apps/frontend/hooks/use-mobile.ts
---

## System / Approach

The frontend (`apps/frontend`) is a Next.js 16 application styled with **Tailwind CSS v4** (via `@tailwindcss/postcss` in `postcss.config.mjs`, no legacy `tailwind.config.js`). The UI layer is built on **shadcn/ui** configured for the **"new-york"** style (see `components.json`), which wraps **Radix UI primitives** (`@radix-ui/*`) and uses **class-variance-authority (cva)** + **clsx** + **tailwind-merge** (`cn` from `@/lib/utils`) to compose variant-driven component classes.

Theming is done through **CSS custom properties** defined in `app/globals.css` under `:root` and `.dark`, using the OKLCH color space. A `@theme inline { ... }` block maps brand tokens (`--color-primaryColor`, `--color-secondaryColor`, `--color-bgsecondColor`, `--color-headerColor`, `--color-secondColor`) into Tailwind's design-token namespace, while also aliasing fonts (`--font-sans`, `--font-mono`, `--font-quicksand`, `--font-castor`) and radius scales (`--radius-sm/md/lg/xl`).

Dark mode is enabled via the `dark:` class strategy driven by `next-themes` (`useTheme` context). The `@custom-variant dark (&:is(.dark *))` declaration in `globals.css` wires Tailwind's `dark:` prefix to the `.dark` class applied at the document root.

Animations are provided by the `tailwindcss-animate` plugin (`@plugin "tailwindcss-animate"`) plus several hand-written keyframes in `globals.css` (`marquee`, `marquee-reverse`, `loading`, `shimmer`, `fadeIn`).

## Key Files

- `apps/frontend/app/globals.css` — single source of truth for Tailwind imports, theme variables, base/utility layers, animations, scrollbars, reduced-motion rules.
- `apps/frontend/components.json` — shadcn/ui configuration (style: `new-york`, RSC, TSX, aliases `@/components`, `@/components/ui`, `@/lib`, `@/hooks`, icon library `lucide`).
- `apps/frontend/postcss.config.mjs` — registers `@tailwindcss/postcss`.
- `apps/frontend/package.json` — declares Tailwind v4, `tailwindcss-animate`, `@tailwindcss/postcss`, `class-variance-authority`, `clsx`, `tailwind-merge`, `next-themes`, and all `@radix-ui/*` primitives.
- `apps/frontend/components/ui/*.tsx` — ~50 shadcn-generated primitive components (button, dialog, table, sidebar, calendar, chart, etc.).
- `apps/frontend/hooks/use-media-query.ts` and `apps/frontend/hooks/use-mobile.ts` — responsive breakpoints helpers used across components.

## Architecture and Conventions

1. **Component styling via cva**: Every shadcn/ui component defines its variants with `cva()` (e.g. `buttonVariants`, `alertVariants`, `badgeVariants`, `sidebarMenuButtonVariants`, `groupStyle` in `button-group.tsx`). Variants cover `variant` (default/destructive/outline/secondary/ghost/link) and `size` (default/sm/lg/icon variants).
2. **Class merging via `cn()`**: All className composition goes through the shared `cn` utility (from `@/lib/utils`, re-exporting `clsx` + `tailwind-merge`), so caller-supplied classes merge cleanly with defaults.
3. **Design tokens over magic values**: Colors, radii, and fonts are exposed as CSS variables; brand-specific colors (`primaryColor`, `secondaryColor`, `bgsecondColor`, `headerColor`, `secondColor`) live in the `@theme inline` block and are consumed as `bg-primaryColor`, `text-secondaryColor`, etc.
4. **Layered CSS organization**: `globals.css` uses Tailwind's `@layer base` (global resets, body font), `@layer utilities` (animations, helper classes like `.product-bg`, `.promotional-banner-bg`, `.gradient-text`, `.scrollbar-hide`), and top-level keyframes.
5. **Responsive strategy**: Breakpoints are handled programmatically via `useMediaQuery` / `useIsMobile` hooks rather than relying solely on Tailwind breakpoints. Components such as `sidebar`, `notification-bell`, and admin inbox modal switch behavior based on mobile detection.
6. **Iconography**: Icons come from `lucide-react` (configured as the shadcn icon library) and `react-icons`; they are composed inside components via Radix `Slot` or directly.
7. **Animation conventions**: Custom animations (`animate-marquee`, `animate-shimmer`, `animate-fadeIn`) are declared in `globals.css` and gated behind `prefers-reduced-motion: reduce` media queries that strip transitions/animations for accessibility.
8. **Scrollbars**: Global thin scrollbars are enforced via `* { scrollbar-width: thin; scrollbar-color: ... }` plus WebKit overrides, with a `.scrollbar-hide` utility for content containers.
9. **No Tailwind config file**: With Tailwind v4, there is no `tailwind.config.js`; customization lives entirely in `globals.css` (`@theme inline`, `@custom-variant`, `@plugin`).

## Conventions and Constraints

- **Observed convention**: New UI components are placed under `components/ui/` and generated via shadcn/ui CLI (style `new-york`, RSC, TSX). They follow the cva + cn pattern seen in `button.tsx`.
- **Observed convention**: Brand colors are referenced as `var(--color-primaryColor)` / `var(--color-secondaryColor)` rather than hard-coded hex literals in components.
- **Observed convention**: Dark-mode variants use the `dark:` Tailwind prefix, which is active when the `.dark` class is present on the document root (wired via `@custom-variant dark`).
- **Enforced by tooling**: PostCSS pipeline is fixed to `@tailwindcss/postcss` in `postcss.config.mjs`; adding another processor requires editing this file.
- **Enforced by shadcn schema**: `components.json` pins the project to the `new-york` style, RSC mode, TSX output, and `lucide` icon library — any new shadcn component will conform to these settings.
- **Accessibility constraint**: `globals.css` contains a `@media (prefers-reduced-motion: reduce)` block that disables carousel slides, fade-in, and shimmer animations, making motion reduction a runtime requirement.