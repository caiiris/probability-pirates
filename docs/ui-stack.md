# UI Stack & Consistency Guide

> **Source of truth** for all UI implementation in Phase 1. Every spec doc references this file. Decision history: alternatives log **D36–D37**.
>
> **Voice and visual judgment live in `docs/ui-directive.md`.** That doc overrides anything here. This doc covers stack and implementation primitives; the directive covers what the product feels like and what makes UI read as not-AI-generated. Read the directive first; treat this file as the toolbox.

---

## Stack at a glance

| Layer                 | Tool                                                                                        | Use for                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Component library** | [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS                                           | Buttons, cards, inputs, progress, badges, avatars, dialogs, toasts, bottom nav        |
| **Lesson motion**     | Framer Motion                                                                               | Step transitions, correct/wrong feedback, celebration screen animations               |
| **Optional polish**   | [Animbits](https://www.animbits.dev/) (selective)                                           | Confetti, count-up, tap feedback — only where it clearly beats a short Framer snippet |
| **Icons**             | Lucide React (shadcn default)                                                               | Nav, streak flame, lock, check, close                                                 |
| **Type**              | Bricolage Grotesque (display) · Inter (body) · JetBrains Mono (data), all via `@fontsource` | Headings · UI copy · numerals                                                         |

**Do not add:** a second component library (MUI, Chakra), a third animation library, or ad-hoc CSS-in-JS beyond Tailwind utilities.

---

## Design tokens

> **Updated 2026-06-23 (design overhaul, Category 1).** Tokens now live in a
> three-layer system in `src/index.css`. Components reference Layer 2/3 tokens
> only — never raw hex. JS (confetti, illustration palettes, charts) reads the
> same accent ramp from `src/lib/theme.ts`. See the header comment in
> `index.css` for how to add a new accent hue.
>
> - **Layer 1 — primitive ramps:** the only place hex lives. Neutrals plus six
>   accents (`violet`, `blue`, `teal`, `green`, `amber`, `coral`), each with
>   `-soft` (tint), `-base`, `-deep` (text/edge).
> - **Layer 2 — semantic tokens:** the shadcn contract (`--primary`,
>   `--muted`, …) plus Pascal additions (`--success`, `--streak`, `--info`,
>   `--primary-soft`, `--primary-deep`). Remap here to retheme.
> - **Layer 3 — `@theme inline`:** exposes everything as Tailwind utilities
>   (`bg-primary`, `bg-teal-soft`, `text-coral-deep`, `shadow-soft`, …) and the
>   font roles (`font-display`, `font-sans`, `font-mono`).

| Token                               | Hex                   | Usage                                                        |
| ----------------------------------- | --------------------- | ------------------------------------------------------------ |
| `--primary`                         | `#6B4EFF`             | CTAs, active nav, grid cell highlight, links (Pascal violet) |
| `--primary-soft` / `--primary-deep` | `#EEE9FF` / `#3A2A8C` | Tinted primary surfaces / chunky-button depth, pressed       |
| `--success` / correct               | `#22C55E`             | Correct feedback, completed badge                            |
| `--destructive` / wrong             | `#FB5E58`             | Wrong feedback flash (use sparingly — shake first)           |
| `--streak`                          | `#F59E0B`             | Flame icon, daily goal done, milestone trophies              |
| `--info`                            | `#2E8FFF`             | Informational accents, neutral highlights                    |
| `--background`                      | `#FAFAFC`             | Page background (warm, faintly plum-tinted)                  |
| `--foreground`                      | `#211C30`             | Body text, headings (warm plum-charcoal)                     |

**Color discipline:** chrome stays calm (primary + neutrals + semantic). The
full accent ramp is for _playful_ surfaces — illustrations, lesson nodes, tags —
so the app reads colorful (Brilliant-like) without rainbow chrome.

`--radius` is `0.75rem` (rounder, friendlier). `--btn-depth` (`4px`) is the
solid bottom offset reserved for tactile/chunky buttons (Category 4).

**Typography:** Bricolage Grotesque (`font-display`) on `h1`–`h3`; Inter
(`font-sans`) for body and UI; JetBrains Mono (`font-mono` / `.num`) for
numerals (XP, fractions, stats). 16px minimum body (`text-base`), prompts
`text-xl`–`text-2xl`, lesson titles `text-2xl`–`text-3xl`. Use shadcn `Card`
for lesson slots — no custom card CSS per screen.

**Touch targets:** minimum 44×44px on mobile; scales to 56px on tablet (`md:`) and 64px on desktop (`lg:`) for grid cells and primary interactive elements. Full-width primary CTA on the lesson player. Use shadcn `Button` with `size="lg"` and `className="w-full md:w-auto md:min-w-[280px]"` for Check / Continue (full-width on mobile, generous fixed width on tablet+).

**Layout (per D63 — truly responsive):** Pattern B — every screen reflows for mobile, tablet (`md:` 768px), desktop (`lg:` 1024px). Navigation chrome transitions from bottom nav (mobile) to sidebar (tablet+). Lesson lists go 1-col → 2-col → 3-col. Lesson player content centers in `max-w-2xl` on tablet+, full-bleed on mobile. Generous padding (`p-4` mobile, `p-6`–`p-8` tablet+). One primary focus per screen at every breakpoint.

---

## Consistency rules

### Rule 1 — App chrome → shadcn only

Home, Profile, Auth, course path, celebration screen layout, bottom nav, modals, toasts: **always** shadcn components.

**MVP component list** (install during scaffold):

```
button card input label progress badge avatar
dialog sonner separator tabs sidebar tooltip
```

Install via:

```bash
npx shadcn@latest init
npx shadcn@latest add button card input label progress badge avatar dialog sonner separator sidebar tooltip
```

Discover community add-ons via the [shadcn registry directory](https://ui.shadcn.com/docs/directory). Only install from registries you have reviewed.

### Rule 2 — Lesson player motion → Framer Motion

- Slot enter/exit: horizontal slide via `AnimatePresence` + `motion.div`
- Correct answer: green `Check` icon scales in (`scale: 0 → 1`, ~200ms, ease-out)
- Wrong answer: container shakes horizontally (`x: [0, -8, 8, -8, 8, 0]`, 200ms) — **never** block the whole screen red
- Tap feedback on interactive elements: `whileTap={{ scale: 0.97 }}`

Use the same timing constants everywhere — define in `src/lib/motion.ts`:

```ts
export const MOTION = {
  fast: 0.2,
  slide: { type: 'spring', stiffness: 300, damping: 30 },
} as const;
```

### Rule 3 — Animbits → celebration & delight only

Animbits is a shadcn-ecosystem registry for interactive UI primitives ([animbits.dev](https://www.animbits.dev/)). Use it **selectively**:

| OK to use Animbits                                         | Use Framer instead       |
| ---------------------------------------------------------- | ------------------------ |
| Confetti on lesson complete                                | Slot transitions         |
| XP count-up number animation                               | Correct/wrong feedback   |
| Optional tap sparkle on grid cell (if registry piece fits) | Progress bar fill        |
|                                                            | Bottom nav, cards, forms |

**Cap:** at most **2–3 Animbits components** in the whole MVP. If a Framer snippet is <30 lines, prefer Framer.

Install pattern:

```bash
npx shadcn add @animbits/<component-name>
```

Review generated source before committing — community registries are third-party.

### Rule 4 — Custom SVG for lesson content

Dice, coins, cards, grids: hand-rolled SVG in `src/components/illustrations/`. Geometric, flat, consistent stroke width. **Not** shadcn, **not** Animbits, **not** stock illustrations.

### Rule 5 — Feedback colors

- Correct: emerald check + `text-emerald-600` confirmation copy
- Wrong: rose flash on the specific wrong element only (200ms), then hint text in `text-muted-foreground` — not a full-screen error state
- Neutral / hint: shadcn muted foreground, no red until the second wrong attempt

### Rule 6 — Toasts vs inline feedback

- **Inline** (below the interaction): answer feedback, hints, explanations — always inline in the lesson player
- **Toast** (Sonner): system events only — "Unlocks after Lesson 1", "Daily goal hit", network errors

---

## Screen → component map

| Screen               | Primary shadcn components              | Motion                                     |
| -------------------- | -------------------------------------- | ------------------------------------------ |
| Login / Register     | `Card`, `Input`, `Label`, `Button`     | Form error shake (Framer)                  |
| Home / course path   | `Card`, `Badge`, `Progress`, `Button`  | Hero card fade-in                          |
| Lesson player        | `Button`, `Progress`                   | Slot slide, feedback animations            |
| Celebration          | `Card`, `Badge`, `Progress`            | Confetti (Animbits or Framer), XP count-up |
| Profile              | `Avatar`, `Card`, `Badge`, `Separator` | Stats count-up optional                    |
| Leave-lesson confirm | `Dialog`                               | —                                          |

---

## Scaffold checklist

When setting up the Vite + React app:

1. [ ] `npx shadcn@latest init` — Vite, Tailwind, CSS variables
2. [ ] Set `--primary`, custom `--success`, `--streak` in `src/index.css`
3. [ ] Add Inter font
4. [ ] Install MVP shadcn components (list above)
5. [ ] Add Framer Motion: `npm install framer-motion`
6. [ ] Create `src/lib/motion.ts` with shared timing constants
7. [ ] Optionally add 1 Animbits confetti component for celebration screen
8. [ ] Build a `<AppShell>` with bottom nav using shadcn `Button` variants — reuse on Home and Profile

---

## Out of scope (Phase 1)

- Dark mode
- Chart components from registry (custom SVG/canvas for simulations in Lesson 2+)
- Full Animbits catalog — cherry-pick only
- Custom design system parallel to shadcn tokens

**In scope (per D63):** shadcn `Sidebar` component for tablet+ navigation; tablet/desktop layouts for every screen.

---

## References

- `docs/ui-directive.md` — voice, copy, and visual judgment (the directive). Read first.
- [shadcn/ui docs](https://ui.shadcn.com/docs)
- [shadcn registry directory](https://ui.shadcn.com/docs/directory)
- [Animbits](https://www.animbits.dev/)
- PRD §4 — UI direction (feel, colors, type)
- Alternatives log D36 (shadcn foundation), D37 (Animbits selective use)
