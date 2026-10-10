---
version: alpha
name: Gumrai Bubblegum
description: Bubblegum on cream for a Thai profit calculator. Soft to touch, exact to the satang.
colors:
  # Generated from src/styles/presets/bubblegum.css: the palette, then the roles that point at it.
  paper-0: "oklch(0.994 0.004 345)"
  paper: "oklch(0.975 0.012 345)"
  paper-2: "oklch(0.95 0.02 345)"
  paper-3: "oklch(0.915 0.03 345)"
  line-2: "oklch(0.925 0.016 345)"
  line: "oklch(0.885 0.022 345)"
  ink-3: "oklch(0.5 0.03 340)"
  ink-2: "oklch(0.38 0.035 340)"
  ink: "oklch(0.24 0.035 340)"
  gum: "oklch(0.8 0.12 350)"
  gum-deep: "oklch(0.64 0.17 354)"
  gum-ink: "oklch(0.5 0.19 356)"
  gum-tint: "oklch(0.935 0.04 350)"
  mint: "oklch(0.86 0.1 165)"
  mint-deep: "oklch(0.7 0.13 162)"
  mint-ink: "oklch(0.47 0.11 160)"
  mint-tint: "oklch(0.945 0.04 165)"
  razz: "oklch(0.66 0.15 248)"
  razz-ink: "oklch(0.48 0.16 255)"
  razz-tint: "oklch(0.945 0.03 245)"
  cinnamon: "oklch(0.54 0.19 34)"
  cinnamon-tint: "oklch(0.94 0.035 40)"
  grape: "oklch(0.62 0.17 305)"
  lemon: "oklch(0.9 0.13 100)"
  background: "{colors.paper}"
  foreground: "{colors.ink}"
  card: "{colors.paper-0}"
  card-foreground: "{colors.ink}"
  popover: "{colors.paper-0}"
  popover-foreground: "{colors.ink}"
  primary: "{colors.gum}"
  primary-foreground: "{colors.ink}"
  primary-edge: "{colors.gum-deep}"
  secondary: "{colors.paper-2}"
  secondary-foreground: "{colors.ink}"
  muted: "{colors.paper-2}"
  muted-foreground: "{colors.ink-3}"
  accent: "{colors.gum-tint}"
  accent-foreground: "{colors.ink}"
  destructive: "{colors.cinnamon}"
  border: "{colors.line}"
  input: "{colors.line}"
  ring: "{colors.gum-ink}"
  keep: "{colors.mint}"
  keep-edge: "{colors.mint-deep}"
  profit: "{colors.mint-ink}"
  profit-surface: "{colors.mint-tint}"
  loss: "{colors.cinnamon}"
  loss-surface: "{colors.cinnamon-tint}"
  link: "{colors.razz-ink}"
  linked: "{colors.razz-tint}"
  linked-foreground: "{colors.razz-ink}"
  unsaved: "{colors.gum-ink}"
  highlight: "{colors.lemon}"
  pop: "{colors.grape}"
  category-0: "oklch(0.68 0.12 250)"
  category-1: "oklch(0.8 0.13 90)"
  category-2: "oklch(0.64 0.14 310)"
  category-3: "oklch(0.72 0.1 185)"
  category-4: "oklch(0.62 0.13 280)"
  category-5: "oklch(0.76 0.13 120)"
  category-6: "oklch(0.74 0.12 60)"
  category-7: "oklch(0.7 0.1 215)"
  category-none: "oklch(0.8 0.01 345)"
  chart-1: "{colors.category-0}"
  chart-2: "{colors.category-1}"
  chart-3: "{colors.category-2}"
  chart-4: "{colors.category-3}"
  chart-5: "{colors.category-4}"
  commission: "oklch(0.42 0.03 330)"
  commission-vat: "oklch(0.6 0.03 330)"
typography:
  number-display:
    fontFamily: Mitr
    fontSize: 60px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0em
    fontFeature: '"tnum"'
  headline-display:
    fontFamily: Mitr
    fontSize: 56px
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: 0em
  headline-lg:
    fontFamily: Mitr
    fontSize: 36px
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: 0em
  headline-md:
    fontFamily: Mitr
    fontSize: 28px
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: 0em
  title-md:
    fontFamily: Mitr
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0em
  button:
    fontFamily: Mitr
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0em
  body-lg:
    fontFamily: IBM Plex Sans Thai Looped
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0em
  body-md:
    fontFamily: IBM Plex Sans Thai Looped
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0em
    fontFeature: '"tnum"'
  body-sm:
    fontFamily: IBM Plex Sans Thai Looped
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0em
    fontFeature: '"tnum"'
  label-md:
    fontFamily: IBM Plex Sans Thai Looped
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0em
  label-sm:
    fontFamily: IBM Plex Sans Thai Looped
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
rounded:
  # Tailwind's radius names, set in the preset.
  sm: 8px
  md: 10px
  lg: 12px
  xl: 16px
  2xl: 20px
  full: 9999px
spacing:
  base: 4px
  3xs: 4px
  2xs: 8px
  xs: 12px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  2xl: 64px
  3xl: 96px
  gutter: 16px
  content-max: 768px
  editor-max: 1024px
components:
  # One entry per shadcn/ui component variant in src/components/ui, plus Gumrai's own.
  button-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 20px
    height: 44px
  button-default-active:
    backgroundColor: "{colors.primary}"
  button-default-disabled:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.muted-foreground}"
  button-keep:
    backgroundColor: "{colors.keep}"
    textColor: "{colors.foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 20px
    height: 44px
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 20px
    height: 44px
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 20px
    height: 44px
  button-outline-hover:
    backgroundColor: "{colors.accent}"
  button-ghost-hover:
    backgroundColor: "{colors.accent}"
  button-destructive:
    backgroundColor: transparent
    textColor: "{colors.destructive}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 16px
    height: 36px
  button-destructive-hover:
    backgroundColor: "{colors.loss-surface}"
  button-link:
    textColor: "{colors.link}"
    typography: "{typography.body-md}"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 12px
    height: 44px
  input-invalid:
    backgroundColor: "{colors.loss-surface}"
    textColor: "{colors.foreground}"
  input-disabled:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-foreground}"
  label:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.label-md}"
  select-trigger:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 12px
    height: 44px
  select-content:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.popover-foreground}"
    rounded: "{rounded.xl}"
    padding: 4px
  select-item-focus:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.lg}"
  checkbox-checked:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    size: 20px
  badge-linked:
    backgroundColor: "{colors.linked}"
    textColor: "{colors.linked-foreground}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 10px
    height: 24px
  badge-manual:
    backgroundColor: transparent
    textColor: "{colors.muted-foreground}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 10px
    height: 24px
  category-dot:
    size: 10px
    rounded: "{rounded.full}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.2xl}"
    padding: 24px
  card-title:
    typography: "{typography.title-md}"
  card-empty:
    backgroundColor: transparent
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.2xl}"
    padding: 24px
  net-profit:
    backgroundColor: "{colors.profit-surface}"
    textColor: "{colors.profit}"
    typography: "{typography.number-display}"
    rounded: "{rounded.2xl}"
    padding: 20px
  net-loss:
    backgroundColor: "{colors.loss-surface}"
    textColor: "{colors.loss}"
    typography: "{typography.number-display}"
    rounded: "{rounded.2xl}"
    padding: 20px
  sheet-row:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.title-md}"
    rounded: "{rounded.2xl}"
    padding: 20px
  table-head:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.body-sm}"
  table-row-hover:
    backgroundColor: "{colors.accent}"
  table-row-linked:
    backgroundColor: "{colors.linked}"
  alert-dialog:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.popover-foreground}"
    rounded: "{rounded.2xl}"
    padding: 24px
  alert:
    backgroundColor: "{colors.loss-surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: 12px
---

# Gumrai (กำไร)

`DESIGN.html` shows this system working: open it in a browser. The components are shadcn/ui (Radix base), restyled to this system, in `src/components/ui`.

## Overview

Gumrai helps a Thai seller (a café, a drinks stall, a home bakery) work out cost, selling price and profit for each thing they sell. The name is a pun: กำไร (profit) is said "gum-rai". So the app looks like bubblegum and counts like an accountant: **soft to touch, exact to the satang**.

The personality is playful and warm, never childish. Cream paper, a pack of gum-flavour colours, rounded Thai type, chunky push buttons that press down, and one small gum bubble that chews and pops. Everything sweet stops at the numbers, which are exact, aligned and labelled.

The UI is in Thai only and light only. The look derives from Hallmark's Hum theme (playful genre, rounded sans, multi-accent), re-anchored on bubblegum pink.

## Colors

Colours come in two layers. The **palette** is a pack of gum flavours on a pink-leaning cream. The **roles** are shadcn/ui's names plus a few of Gumrai's own, and each one points at a palette colour. Components only ever use roles.

The flavours, and the job each one owns:

- **Bubblegum (`gum`):** action and brand. It is `primary` (the push button, with `ink` text), and its edge is `gum-deep` (`primary-edge`). `gum-tint` is `accent`, the hover and highlight surface. `gum-ink` is `ring` (focus) and `unsaved`.
- **Spearmint (`mint`):** money left over. `mint-ink` is `profit`, `mint-tint` is `profit-surface`, and `mint` is `keep`, the "keep this" button.
- **Blue raspberry (`razz`):** connection. `razz-ink` is `link` and `linked-foreground`, and `razz-tint` is `linked`, the Linked Line surface.
- **Cinnamon (`cinnamon`):** loss, errors and delete. It is `loss` and `destructive`, and `cinnamon-tint` is `loss-surface`. It sits 44° of hue and 26% of lightness away from bubblegum, so pink never reads as a loss.
- **Grape (`grape`, `pop`):** the star-burst when a save lands. Nothing else.
- **Lemon (`lemon`, `highlight`):** a highlighter stroke under the one figure that matters. At most one per screen.

The neutrals run `paper-0` (cards) · `paper` (`background`) · `paper-2` (`muted`, `secondary`) · `paper-3` · `line-2` · `line` (`border`, `input`) · `ink-3` (`muted-foreground`) · `ink-2` · `ink` (`foreground`). All lean slightly pink (hue 340–345). There is no pure white and no pure black.

Data colours: `category-0`…`category-7` colour Cost Categories by slot, and the seller never picks them. `category-none` is ไม่มีหมวด. `chart-1`…`chart-5` point at the first five slots for any shadcn chart. `commission` and `commission-vat` are the platform's share in the split chart. Category hues stay clear of gum (330–10°), cinnamon (20–45°) and mint (135–170°).

## Typography

Two Thai faces, both round. **Mitr** (`font-heading`: soft corners, loopless Thai) carries headings, card titles, big figures and buttons. **IBM Plex Sans Thai Looped** (`font-sans`, the default) carries everything else. It has the looped Thai most sellers learned at school and tabular figures for tables. Both load through `next/font` in `src/app/layout.tsx`, and there is no third family.

- **Headlines:** Mitr 500. Sentence case.
- **Numbers:** `number-display` (Mitr 600, tabular) for the one big figure per screen, usually the Net Profit.
- **Body and labels:** Plex Looped 400 at 16px. Labels are 14px in `muted-foreground`.
- **Thai rules:** heading line-height of at least 1.35 and body line-height around 1.7, or the tone marks clip. Never use `leading-none` on Thai text. Letter-spacing stays at 0. Thai has no capitals, so there are no uppercase labels, and no italics in either language.

## Layout

Single-column pages up to `content-max` (768px), centred, with a 16px gutter on phones. The sheet editor is wider (`editor-max`, 1024px) so its line table fits. Spacing follows a 4px scale (`3xs` 4px through `3xl` 96px). Related fields sit together in one card with 24px padding. Cards stack with 24px between them. Tables scroll sideways inside their card on small screens, but the page itself never scrolls sideways.

Every screen must work at 320, 375, 414 and 768px. A form grid collapses to one column on phones. Buttons and nav links never wrap onto two lines.

## Elevation & Depth

Chewy, not glossy. Depth comes from two quiet shadows and from tinted surfaces.

- `shadow-card`: a 1px contact shadow plus a soft 30px ambient shadow, both in `ink` at low opacity. Cards, sheet rows, secondary buttons.
- `shadow-lift`: a deeper version for a pressable card on hover, dialogs and select menus.
- The push button's solid edge: `0 4px 0 0 primary-edge` (full width, never a negative spread). It grows to 6px on hover and shrinks to 1px on press.
- Money cards and alerts sit on a tint (`profit-surface`, `loss-surface`) with no shadow. An empty state is a 2px dashed `border` with no fill.
- No glass, blur, glow or neon. The dialog overlay is a plain `foreground` wash at 20%, with no blur.

The shadow values live in `src/styles/presets/bubblegum.css`.

## Shapes

Everything is round, and nothing is square.

- Cards, sheet rows, dialogs and money cards: `rounded-2xl` (20px).
- Select menus: `rounded-xl` (16px).
- Inputs, select triggers, alerts and menu items: `rounded-lg` (12px).
- Buttons, badges and category dots: `rounded-full`.
- Table rows and card footers are divided by dashed hairlines in `border`.

## Components

All of them are shadcn/ui components in `src/components/ui`, restyled to this system. Add new ones with `bunx shadcn@<version> add <name>` (pin a CLI version that is at least 7 days old, per `bunfig.toml`), then restyle them to these tokens before use.

### Button

- `default`: the pink push button for the main action. There is one per screen. Hover lifts it 2px and its edge grows. Pressing pushes it down 3px and its edge shrinks, so the press itself is the feedback. There is no scaling.
- `keep`: a mint push for "keep this" (ลิงก์กับรายการนี้แทน, บันทึกเข้าลิสต์ต้นทุน).
- `secondary` (card plus shadow), `outline` (hairline that turns pink) and `ghost` are for everything else. `link` is blue raspberry text.
- `destructive` (ลบ) is a cinnamon outline, never a filled button, and always goes through `ConfirmAction` (an `AlertDialog`) before anything is deleted.
- Sizes: `default` 44px, `sm` 36px, `xs` 28px (inline table actions). Every button has default, hover, focus-visible (a 3px `ring` with an offset, shown instantly), active, disabled (50% opacity) and pending (its label changes to กำลัง…) states.

### Input, Select, Checkbox

`Input` and `Select` share one look: a `card` surface, a hairline `input` border that turns pink on hover, and on focus a `ring` border with an `accent` halo. An invalid field (`aria-invalid`) fills with `loss-surface`, and one line under it in `loss` says what to do. Numbers are right-aligned with tabular figures, and the unit sits in the label (ราคาขายต่อแก้ว (฿)).

Dropdowns are the shadcn `Select`, through `OptionSelect` (`src/components/option-select.tsx`). It shows category dots, maps ไม่มีหมวด's empty value safely, and posts its value with the form. Its menu is a `popover` card with `accent` highlighted items and a `ring`-coloured check. Never use a bare `<select>`, because its open menu can't be themed.

`Field` (`src/components/field.tsx`) puts a `muted-foreground` label above any control. `Checkbox` is 20px with a `primary` fill when checked.

### Badge and dots

`Badge` variant `linked` (ลิงก์ลิสต์) marks a Linked Line, and `manual` (พิมพ์เอง) is a hairline outline. A `CategoryDot` is a 10px gumball in the category's slot colour.

### Card and money

`Card` is the container for every section: `CardTitle` is Mitr. A first-run card is dashed with no fill, and says what's missing above the one form to fill. The Net Profit is a `profit-surface` (or `loss-surface`) panel: a label (กำไรสุทธิต่อแก้ว or ขาดทุนต่อแก้ว) above the `number-display` figure and its share of the price. Sheet rows are cards that lift on hover.

### Table

`Table` holds the Cost List and a sheet's cost lines. Headers are `muted-foreground`, rows are divided by dashed hairlines, and hovering a row tints it `accent`. A whole-row link stretches the name link over the row. Money and quantities are right-aligned with tabular figures. Linked Lines are tinted `linked`.

### Feedback

An error alert is one line of `foreground` text on `loss-surface`, saying what happened and why. There are no toasts: a button's own pending state, and the grape star-burst on save, are the confirmation.

### The bubble

The one character is a gum bubble covering the circle of กำ in the wordmark. It chews slowly, and a click pops it with a grape star-burst and it grows back. It appears once per screen and is built in CSS: `Wordmark` in `src/components/wordmark.tsx`, with its keyframes as `--animate-*` tokens in the preset.

## Do's and Don'ts

- Do use one pink push button per screen, for the main action.
- Do give a loss three signals: the word ขาดทุน, a true minus sign (−), and `loss`. Colour alone never carries meaning.
- Do name the Sale Unit beside every per-sale figure: กำไรต่อแก้ว, never just กำไร.
- Do show money to two decimals with `Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`, with the baht sign after the number (`13.95 ฿`, `4 ฿/g`). A Unit Cost keeps the precision the seller typed.
- Do right-align numbers and use tabular figures wherever numbers stack.
- Do keep WCAG AA contrast. `primary` always carries `primary-foreground` (ink) text. Small text on `loss-surface` is `foreground`; `loss` text on a tint is for large figures only.
- Do use role utilities (`bg-primary`, `text-muted-foreground`, `text-profit`) in components, never palette ones (`bg-gum`).
- Don't put pink on a number. Money is `profit` or `loss`.
- Don't use gradients between flavours, pure white paper or pure black ink.
- Don't use square corners, glass, blur or glow.
- Don't use italics, uppercase, `leading-none` or letter-spacing on Thai, or a heading line-height under 1.35.
- Don't use `window.confirm` for a delete; use `ConfirmAction`.
- Don't show an invented figure. Empty data reads ยังไม่มี…
- Don't use emoji as icons, or celebration toasts.
- Don't write a colour anywhere except the preset and this file's front matter.

## Motion

Plain CSS plus `tw-animate-css` for shadcn's open and close animations. There is no motion library. The app moves in three ways: press, chew, pop.

- Buttons use `ease-press` (`cubic-bezier(0.2, 0.7, 0.3, 1)`): 150ms on hover, 75ms on press.
- Pressable cards lift 2px with `ease-spring` (`cubic-bezier(0.34, 1.56, 0.64, 1)`) over 200ms.
- Dialogs and menus fade and zoom in over 100ms.
- The bubble chews from 1 to 1.08 every 4s. A save fires one grape star-burst in 420ms and never loops.
- Everything else (focus, badges, rows) changes colour only.
- With `prefers-reduced-motion: reduce`, nothing moves position, the bubble holds still, the star-burst is off, and colour changes take 120ms or less.

## Voice

Thai, warm and short: a friend who's good with numbers. Use the words in `GLOSSARY.md` exactly (รายการต้นทุน, not สินค้า; กำไรสุทธิ, not มาร์จิ้น). Buttons are plain verbs: บันทึก, สร้าง, ทำสำเนา. Errors say what happened and what to do: ราคาขาย 40 ฿ ยังไม่พอจ่ายต้นทุน. The fun comes from the colour and the bubble, never from jokes.

## Implementation

- `src/styles/presets/bubblegum.css` holds every token, palette then roles, in Tailwind v4 `@theme` blocks. `src/styles/globals.css` imports Tailwind, `tw-animate-css`, `shadcn/tailwind.css` and the preset, and keeps shadcn's `dark:` classes behind a `.dark` class the app never sets.
- This file's `colors` front matter is generated from the preset (palette, then roles, as `{colors.…}` references). Change a value in the preset, regenerate the block, then update the matching swatch in `DESIGN.html`.
- Components use the role utilities (`bg-primary`, `text-muted-foreground`, `rounded-2xl`, `shadow-card`, `font-heading`, `ease-press`), or `var(--color-…)` where a utility can't reach, as in chart code.
- Class merging uses `cn` (shadcn's package), re-exported from `src/lib/utils.ts`.
