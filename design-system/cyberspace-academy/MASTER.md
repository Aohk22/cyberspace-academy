# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** CyberSpace Academy
**Updated:** 2026-07-15
**Category:** Cybersecurity Education Platform

---

## Global Rules

### Color Palette

| Role              | Light Hex  | Dark Hex  | CSS Variable          |
| ----------------- | ---------- | --------- | --------------------- |
| Primary           | `#0F3B5E`  | `#3B82F6` | `--color-primary`     |
| On Primary        | `#FFFFFF`  | `#FFFFFF` | `--color-on-primary`  |
| On Dark           | `#FFFFFF`  | `#FFFFFF` | `--color-on-dark`     |
| Canvas (bg)       | `#FFFFFF`  | `#0A0E1A` | `--color-canvas`      |
| Surface           | `#FFFFFF`  | `#111827` | `--color-surface`     |
| Soft Stone        | `#EEE CE7` | `#1E293B` | `--color-soft-stone`  |
| Hairline (border) | `#D9D9DD`  | `#334155` | `--color-hairline`    |
| Ink (text)        | `#1A1A2E`  | `#E2E8F0` | `--color-ink`         |
| Body Muted        | `#616161`  | `#94A3B8` | `--color-body-muted`  |
| Muted             | `#93939F`  | `#64748B` | `--color-muted`       |
| Action Blue       | `#1863DC`  | `#60A5FA` | `--color-action-blue` |
| Coral             | `#E85D3A`  | `#FB923C` | `--color-coral`       |
| Error             | `#B30000`  | `#EF4444` | `--color-error`       |
| Star              | `#F59E0B`  | `#F59E0B` | `--color-star`        |
| Deep Green        | `#003C33`  | `#003C33` | `--color-deep-green`  |
| Purple            | `#7C3AED`  | `#A78BFA` | `--color-purple`      |

**Color Notes:** Professional navy + blue primary. Clean editorial surfaces. Coral accents for CTAs. Star gold for ratings.

### Typography

- **Display Font:** Space Grotesk (headings)
- **Body Font:** Inter (UI, body, buttons)
- **Mood:** professional, clean, technical, educational, modern, accessible
- **Google Fonts:** Inter + Space Grotesk (loaded in root.tsx)

### Spacing Variables

| Token               | Value  | Usage                     |
| ------------------- | ------ | ------------------------- |
| `--spacing-xs`      | `6px`  | Tight gaps                |
| `--spacing-sm`      | `8px`  | Icon gaps, inline spacing |
| `--spacing-md`      | `12px` | Standard padding          |
| `--spacing-lg`      | `16px` | Section padding           |
| `--spacing-xl`      | `24px` | Large gaps                |
| `--spacing-xxl`     | `32px` | Section margins           |
| `--spacing-section` | `80px` | Hero padding              |

### Border Radius

| Token           | Value    | Usage                |
| --------------- | -------- | -------------------- |
| `--radius-xs`   | `4px`    | Small elements       |
| `--radius-sm`   | `8px`    | Cards, chips         |
| `--radius-md`   | `16px`   | Modals, larger cards |
| `--radius-lg`   | `22px`   | Featured cards       |
| `--radius-xl`   | `30px`   | Pill controls        |
| `--radius-pill` | `32px`   | Primary CTAs         |
| `--radius-full` | `9999px` | Round elements       |

### Shadow Depths

| Level       | Value                          | Usage              |
| ----------- | ------------------------------ | ------------------ |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)`   | Subtle lift        |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.1)`    | Cards, buttons     |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)`  | Modals, dropdowns  |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero cards, modals |

---

## Style Guidelines

**Style:** Professional Editorial + Tech

**Keywords:** Clean, modern, educational, accessible, dark mode, content-first, technical, premium

**Best For:** Cybersecurity education platforms, LMS, developer tools, professional services

### Key Effects

- Flat surfaces with hairline borders for depth
- Coral accent for CTAs and challenge points
- Deep green for dedicated brand sections
- Progress bars using primary color
- Semantic category colors (purple, cyan, rose, indigo) for challenge tags

---

## Component Patterns

### Buttons

- **Primary:** `bg-primary text-on-primary rounded-xl font-bold hover:brightness-110`
- **Secondary:** `bg-soft-stone text-ink rounded-xl font-bold`
- **Ghost:** `text-ink hover:text-primary`
- **Outline:** `border border-hairline text-ink hover:bg-soft-stone`

### Cards

- Default: `bg-surface border border-hairline rounded-xl p-4`
- Hover: `hover:border-primary/30`
- Dark: `bg-primary text-on-primary` (for featured sections)

### Inputs

- Default: `w-full px-3 py-2 bg-soft-stone/50 border border-hairline rounded-lg text-sm text-ink`
- Focus: `focus:bg-soft-stone focus:ring-2 focus:ring-primary/10 focus:border-primary`

### Form Labels

- `text-xs font-bold text-muted uppercase tracking-widest`

---

## Anti-Patterns (Do NOT Use)

- ❌ `text-on-primary` on light/white surfaces (use `text-ink`)
- ❌ `text-ink` on primary-colored buttons (use `text-on-primary`)
- ❌ Hardcoded `text-white` / `bg-white` (use `text-on-primary` / `bg-on-dark`)
- ❌ Non-existent CSS tokens like `*-foreground-elevated`, `*-surface-text-hl-bg`
- ❌ Emojis as icons (use Lucide icons from `lucide-react`)
- ❌ Layout-shifting hovers (avoid scale transforms that shift layout)
- ❌ Low contrast text — maintain 4.5:1 minimum contrast ratio
- ❌ Instant state changes — always use transitions (150-300ms)

---

## Pre-Delivery Checklist

- [ ] No emojis used as icons (use Lucide SVG)
- [ ] All icons from consistent icon set (Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Text contrast 4.5:1 minimum in both themes
- [ ] Focus states visible for keyboard navigation
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
- [ ] `text-on-primary` only used ON `bg-primary` backgrounds
- [ ] `text-ink` used for default text on light/dark surfaces
