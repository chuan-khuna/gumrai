---
version: alpha
name: Gumrai Bubblegum
description: Bubblegum on cream for a Thai profit calculator. Soft to touch, exact to the satang.
colors:
  # Mirrors src/styles/presets/bubblegum.css token for token (same names, same values).
  paper: "oklch(0.975 0.012 345)"
  paper-2: "oklch(0.95 0.02 345)"
  paper-3: "oklch(0.915 0.03 345)"
  card: "oklch(0.994 0.004 345)"
  line: "oklch(0.885 0.022 345)"
  line-2: "oklch(0.925 0.016 345)"
  muted: "oklch(0.5 0.03 340)"
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
  accent: "{colors.gum-ink}"
  profit: "{colors.mint-ink}"
  loss: "{colors.cinnamon}"
  focus: "{colors.gum-ink}"
  category-0: "oklch(0.68 0.12 250)"
  category-1: "oklch(0.8 0.13 90)"
  category-2: "oklch(0.64 0.14 310)"
  category-3: "oklch(0.72 0.1 185)"
  category-4: "oklch(0.62 0.13 280)"
  category-5: "oklch(0.76 0.13 120)"
  category-6: "oklch(0.74 0.12 60)"
  category-7: "oklch(0.7 0.1 215)"
  category-none: "oklch(0.8 0.01 345)"
  commission: "oklch(0.42 0.03 330)"
  commission-vat: "oklch(0.6 0.03 330)"
  # Spec role names, pointing at the flavours above.
  primary: "{colors.gum}"
  on-primary: "{colors.ink}"
  primary-container: "{colors.gum-tint}"
  secondary: "{colors.mint}"
  on-secondary: "{colors.ink}"
  secondary-container: "{colors.mint-tint}"
  tertiary: "{colors.razz}"
  on-tertiary: "{colors.ink}"
  tertiary-container: "{colors.razz-tint}"
  neutral: "{colors.paper}"
  surface: "{colors.paper}"
  surface-container-lowest: "{colors.card}"
  on-surface: "{colors.ink}"
  on-surface-variant: "{colors.ink-2}"
  outline: "{colors.line}"
  outline-variant: "{colors.line-2}"
  error: "{colors.cinnamon}"
  on-error: "{colors.card}"
  error-container: "{colors.cinnamon-tint}"
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
  field: 12px
  card: 20px
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
  content-max: 896px
components:
  button-primary:
    backgroundColor: "{colors.gum}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 12px
    height: 44px
  button-primary-disabled:
    backgroundColor: "{colors.gum-tint}"
    textColor: "{colors.muted}"
  button-primary-error:
    backgroundColor: "{colors.cinnamon-tint}"
    textColor: "{colors.ink}"
  button-primary-success:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink}"
  button-keep:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 12px
    height: 44px
  button-soft:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 12px
    height: 44px
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 12px
    height: 44px
  button-outline-hover:
    backgroundColor: "{colors.gum-tint}"
  button-danger:
    backgroundColor: transparent
    textColor: "{colors.cinnamon}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 8px
  button-danger-hover:
    backgroundColor: "{colors.cinnamon-tint}"
  input-field:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.field}"
    padding: 12px
    height: 44px
  input-field-error:
    backgroundColor: "{colors.cinnamon-tint}"
    textColor: "{colors.ink}"
  input-field-disabled:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.muted}"
  input-label:
    textColor: "{colors.ink-2}"
    typography: "{typography.label-md}"
  chip-linked:
    backgroundColor: "{colors.razz-tint}"
    textColor: "{colors.razz-ink}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 4px
  chip-manual:
    backgroundColor: transparent
    textColor: "{colors.ink-2}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 4px
  chip-category:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 4px
  category-dot:
    size: 10px
    rounded: "{rounded.full}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: 24px
  card-profit:
    backgroundColor: "{colors.mint-tint}"
    textColor: "{colors.mint-ink}"
    typography: "{typography.number-display}"
    rounded: "{rounded.card}"
    padding: 24px
  card-loss:
    backgroundColor: "{colors.cinnamon-tint}"
    textColor: "{colors.cinnamon}"
    typography: "{typography.number-display}"
    rounded: "{rounded.card}"
    padding: 24px
  sheet-row:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.card}"
    padding: 16px
  table-header:
    textColor: "{colors.muted}"
    typography: "{typography.body-sm}"
  table-row-linked:
    backgroundColor: "{colors.razz-tint}"
  alert:
    backgroundColor: "{colors.cinnamon-tint}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.field}"
    padding: 12px
  empty-state:
    backgroundColor: transparent
    textColor: "{colors.ink-2}"
    rounded: "{rounded.card}"
    padding: 32px
  nav-link:
    textColor: "{colors.ink-2}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: 8px
  nav-link-active:
    backgroundColor: "{colors.gum}"
    textColor: "{colors.ink}"
  link:
    textColor: "{colors.razz-ink}"
---

# Gumrai (กำไร)

`DESIGN.html` shows this system working: open it in a browser.

## Overview

Gumrai helps a Thai seller (a café, a drinks stall, a home bakery) work out cost, selling price and profit for each thing they sell. The name is a pun: กำไร (profit) is said "gum-rai". So the app looks like bubblegum and counts like an accountant: **soft to touch, exact to the satang**.

The personality is playful and warm, never childish. Cream paper, a pack of gum-flavour colours, rounded Thai type, chunky push buttons that press down, and one small gum bubble that chews and pops. Everything sweet stops at the numbers, which are exact, aligned and labelled.

The UI is in Thai only and light only. The look derives from Hallmark's Hum theme (playful genre, rounded sans, multi-accent), re-anchored on bubblegum pink.

## Colors

The palette is a pack of gum flavours on a pink-leaning cream. Each flavour owns one job, and the jobs never swap.

- **Bubblegum (`gum`, `primary`):** action and brand. The primary push button fill (with `ink` text), the selected nav item, the focus ring (`gum-ink`), the unsaved dot, the bubble. `gum-deep` is the button's pressed edge. `gum-ink` is the deep pink used as `accent` wherever pink must be text or carry white text.
- **Spearmint (`mint`, `secondary`):** money left over. `mint-ink` is `profit`. `mint` is the saved state and the "keep this" button.
- **Blue raspberry (`razz`, `tertiary`):** connection. Links (`razz-ink`) and Linked Lines that follow a Cost Item (`razz-tint`).
- **Cinnamon (`cinnamon`, `error`):** loss, errors and delete. It sits 44° of hue and 26% of lightness away from bubblegum, so pink never reads as a loss.
- **Grape (`grape`):** the star-burst when a save lands. Nothing else.
- **Lemon (`lemon`):** a highlighter stroke under the one figure that matters. At most one per screen.
- **Wrapper neutrals:** `card`, `paper`, `paper-2`, `paper-3`, `line-2`, `line`, `muted`, `ink-2`, `ink`. All lean slightly pink (hue 340–345). There is no pure white and no pure black.
- **Data:** `category-0`…`category-7` colour Cost Categories by slot. The seller never picks them. `category-none` is ไม่มีหมวด. `commission` and `commission-vat` are the platform's share in the split chart. Category hues stay clear of gum (330–10°), cinnamon (20–45°) and mint (135–170°).

## Typography

Two Thai faces, both round. **Mitr** (soft corners, loopless Thai) carries headings, big figures and buttons. **IBM Plex Sans Thai Looped** carries everything else. It has the looped Thai most sellers learned at school and tabular figures for tables. Both load through `next/font` in `src/app/layout.tsx`, and there is no third family.

- **Headlines:** Mitr 500. Sentence case.
- **Numbers:** `number-display` (Mitr 600, tabular) for the one big figure per screen, usually the Net Profit.
- **Body and labels:** Plex Looped 400 at 16px. Labels are 14px in `ink-2` or `muted`.
- **Thai rules:** heading line-height of at least 1.35 and body line-height around 1.7, or the tone marks clip. Letter-spacing stays at 0. Thai has no capitals, so there are no uppercase labels, and no italics in either language.

## Layout

Single-column pages up to `content-max` (896px), centred, with a 16px gutter on phones. Spacing follows a 4px scale (`3xs` 4px through `3xl` 96px). Related fields sit together in one card with 24px padding. Cards stack with 24px between them. Tables scroll sideways inside their card on small screens, but the page itself never scrolls sideways.

Every screen must work at 320, 375, 414 and 768px. A form grid collapses to one column on phones. Buttons and nav links never wrap onto two lines.

## Elevation & Depth

Chewy, not glossy. Depth comes from two quiet shadows and from tinted surfaces.

- `shadow-card`: a 1px contact shadow plus a soft 30px ambient shadow, both in `ink` at low opacity. Used by cards, sheet rows and the cost table.
- `shadow-lift`: a deeper version for a pressable card on hover.
- `shadow-push`: the push button's solid `gum-deep` edge (4px, full width, never a negative spread) plus a soft pink cast.
- Money cards, states and alerts sit on a tint (`mint-tint`, `cinnamon-tint`) with no shadow.
- No glass, blur, glow or neon.

The shadow values live in `src/styles/presets/bubblegum.css`.

## Shapes

Everything is round, and nothing is square.

- Cards, sections and sheet rows: `rounded.card` (20px).
- Inputs and alerts: `rounded.field` (12px).
- Buttons, chips, nav links, category dots: `rounded.full`.
- Dividers are dashed 1.5px hairlines in `line`. An empty state uses a 2px dashed `line` border.

## Components

### Buttons

- `button-primary`: the pink push button for the main action. There is one per screen. Hover lifts it 2px and its edge grows. Pressing pushes it down 3px and its edge shrinks, so the press itself is the feedback. There is no scaling.
- Every button has eight states: default, hover, focus-visible (a 3px `focus` ring at a 4px offset, shown instantly), active, disabled, loading (spinner plus กำลังบันทึก), error (`button-primary-error`, บันทึกไม่ได้ ลองอีกครั้ง) and success (`button-primary-success`, บันทึกแล้ว).
- `button-keep`: a mint push for "keep this" (บันทึกเข้าลิสต์ต้นทุน). `button-soft` and `button-outline` are for everything else. `button-danger` (ลบ) is a cinnamon outline, never a filled button.

### Inputs

`input-field` is a `card` surface with a hairline `line` ring. Hover turns the ring pink. Focus draws a 2px `gum-deep` ring with a `gum-tint` halo. `input-field-error` tints the field cinnamon and puts one line under it saying what to do. Numbers are right-aligned with the unit as a muted suffix (`฿`, `%`, `฿/g`). The label sits above the field in `input-label`.

### Chips and dots

`chip-linked` (ลิงก์) marks a Linked Line. `chip-manual` (พิมพ์เอง) is a hairline outline. `chip-category` is a category name with its `category-dot`.

### Cards and money

`card-profit` and `card-loss` show the Net Profit: a label (กำไรสุทธิต่อแก้ว) above the `number-display` figure. `sheet-row` cards list the seller's sheets with the per-unit profit or loss on the right, and lift on hover.

### Tables

The cost table sits inside a `card`. Its headers use `table-header`. Money and quantities are right-aligned with tabular figures. Linked Lines are tinted `table-row-linked`. The total row has a solid `line` rule above it.

### Feedback

`empty-state` says what's missing and offers the one next step (ยังไม่มีชีตต้นทุน ตั้งชื่อสิ่งที่ขายเพื่อเริ่มคิดต้นทุนและกำไร). `alert` says what happened and why, in one line. There are no toasts: the button's own success state plus the grape star-burst are the confirmation.

### The bubble

The one character is a gum bubble covering the circle of กำ in the wordmark. It chews slowly, and a click pops it with a grape star-burst and it grows back. It appears once per screen and is built in CSS.

## Do's and Don'ts

- Do use one pink push button per screen, for the main action.
- Do give a loss three signals: the word ขาดทุน, a true minus sign (−), and `loss`. Colour alone never carries meaning.
- Do name the Sale Unit beside every per-sale figure: กำไรต่อแก้ว, never just กำไร.
- Do show money to two decimals with `Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`, with the baht sign after the number (`13.95 ฿`, `4 ฿/g`).
- Do right-align numbers and use tabular figures wherever numbers stack.
- Do keep WCAG AA contrast. White text goes only on `accent` (deep pink), never on `gum`. Small text on `cinnamon-tint` is `ink`; cinnamon text on a tint is for large figures only.
- Don't put pink on a number. Money is mint or cinnamon.
- Don't use gradients between flavours, pure white paper or pure black ink.
- Don't use square corners, glass, blur or glow.
- Don't use italics, uppercase or letter-spacing on Thai, or a heading line-height under 1.35.
- Don't show an invented figure. Empty data reads ยังไม่มี…
- Don't use emoji as icons or celebration toasts.
- Don't write a colour anywhere except the preset and this file's front matter.

## Motion

Plain CSS, no motion library. The app moves in three ways: press, chew, pop.

- Buttons use `ease-press` (`cubic-bezier(0.2, 0.7, 0.3, 1)`): 140ms on hover, 70ms on press.
- Pressable cards lift 3–4px with `ease-spring` (`cubic-bezier(0.34, 1.56, 0.64, 1)`) over 220ms.
- The bubble chews from 1 to 1.08 every 4s. A save fires one grape star-burst in 420ms and never loops.
- Everything else (focus, chips, nav) changes colour only.
- With `prefers-reduced-motion: reduce`, nothing moves position, the bubble holds still, the star-burst is off, and colour changes take 120ms or less.

## Voice

Thai, warm and short: a friend who's good with numbers. Use the words in `CONTEXT.md` exactly (รายการต้นทุน, not สินค้า; กำไรสุทธิ, not มาร์จิ้น). Buttons are plain verbs: บันทึก, สร้างชีต, ทำสำเนา. Errors say what happened and what to do: ราคาขาย 40 ฿ ยังไม่พอจ่ายต้นทุน. The fun comes from the colour and the bubble, never from jokes.

## Implementation

- The front matter mirrors `src/styles/presets/bubblegum.css`, token for token, and `src/styles/globals.css` imports that preset. Change a value in both places, then update the matching swatch in `DESIGN.html`.
- Components use the Tailwind utilities the preset generates (`bg-paper`, `text-profit`, `rounded-card`, `shadow-card`, `font-display`, `ease-press`), or `var(--color-…)` where a utility can't reach, as in chart code.
