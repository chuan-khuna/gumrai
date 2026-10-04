# Design — Gumrai (กำไร)

The locked design system. Every page shares it; amend this file on purpose rather than overriding it locally. `DESIGN.html` shows it working: open it in a browser.

Gumrai is a pun: กำไร (profit) is said "gum-rai". So the app looks like bubblegum and counts like an accountant: **soft to touch, exact to the satang**.

## System

- Genre · playful (Hallmark)
- Theme · custom, derived from Hallmark's Hum · vibe: "bubblegum cream, chewy, exact to the satang"
- Axes · light paper / rounded-sans display / multi-accent anchored on gum pink (hue 350)
- Light only. UI text is Thai only.

## Where the tokens live

- `src/styles/presets/bubblegum.css` holds every token, in Tailwind v4 `@theme` blocks. It is the only place a colour is written down.
- `src/styles/globals.css` imports Tailwind, then the active preset, then the few base rules. Another theme would be another file in `presets/`.
- Components use the generated utilities (`bg-paper`, `text-profit`, `rounded-card`, `shadow-card`, `font-display`, `ease-press`), or `var(--color-…)` where a utility can't reach, as in chart code. They never write a colour themselves.

## Colour: a pack of gum flavours

Each flavour has one job, and the jobs never swap.

| Flavour | Tokens | Job |
| --- | --- | --- |
| Bubblegum ชมพูหมากฝรั่ง | `gum` (fill) · `gum-deep` (button edge) · `gum-ink` (text) · `gum-tint` (band) | Action and brand: the main button, selected nav, focus ring, the unsaved dot, the bubble |
| Spearmint มิ้นต์ | `mint` · `mint-deep` · `mint-ink` · `mint-tint` | Profit, and the saved state |
| Blue raspberry บลูราสเบอร์รี่ | `razz` · `razz-ink` · `razz-tint` | Links, and Linked Lines that follow a Cost Item |
| Cinnamon อบเชย | `cinnamon` · `cinnamon-tint` | Loss, errors, delete |
| Grape องุ่น | `grape` | The star-burst when a save lands, nothing else |
| Lemon เลมอน | `lemon` | A highlighter stroke under the one figure that matters, at most one per page |

Roles the components use: `accent` = `gum-ink`, `profit` = `mint-ink`, `loss` = `cinnamon`, `focus` = `gum-ink`.
`accent` is the *deep* pink so white text on it and pink text on paper both stay legible. The light `gum` fill always carries `ink` text.

Neutrals, from light to dark: `card` · `paper` · `paper-2` · `paper-3` · `line-2` · `line` · `muted` · `ink-2` · `ink`. All of them lean slightly pink. There is no pure white and no pure black.

Data colours: `category-0`…`category-7` and `category-none` (ไม่มีหมวด), picked by slot, never by the seller. `commission` and `commission-vat` are the platform's share in the split chart. Category hues stay clear of gum (330–10°), cinnamon (20–45°) and mint (135–170°), so a chart slice can't be mistaken for an action, a loss or a profit.

## Type

- **Display** · Mitr 500/600 (`font-display`): headings, big figures, buttons. Soft corners, loopless Thai.
- **Body** · IBM Plex Sans Thai Looped 400/500 (`font-sans`, the default): everything else. The looped Thai most sellers learned at school, with tabular figures.
- Both are loaded through `next/font` in `src/app/layout.tsx`. There is no third family.
- Thai rules: heading line-height ≥ 1.35 and body line-height ≈ 1.7, or the tone marks clip. Letter-spacing stays at 0 on Thai. No uppercase and no italics, in Thai or English.
- Scale: body 16px. Labels are `text-sm` and `text-muted`. Headings step up from `text-lg` to `text-3xl`. One big figure per screen at 40–60px.

## Shape and depth: chewy, not glossy

- Radii: `rounded-card` (20px) for cards and sections, `rounded-field` (12px) for inputs, `rounded-full` for buttons and chips. No square corners.
- Shadows: `shadow-card` (contact plus air) at rest, `shadow-lift` on a pressable card's hover, `shadow-push` for the push button's edge.
- Dividers are dashed 1.5px hairlines in `line`. Money and state cards sit on a tint with no shadow.
- No glass, blur, glow or gradients between flavours.

## Parts

- **Push button** (main action): `gum` fill, `ink` text, fully round, a `gum-deep` edge underneath. Hover lifts it 2px and pressing pushes it down 3px, so the press is the feedback. One per screen.
- **Mint push** for "keep this" (บันทึกเข้าลิสต์ต้นทุน). **Soft** (card plus shadow) and **outline** (hairline) for the rest. **Delete** is a cinnamon outline, never a filled button.
- Every button has all eight states: default, hover, focus-visible, active, disabled, loading (spinner + กำลังบันทึก), error (cinnamon tint + บันทึกไม่ได้ ลองอีกครั้ง), success (mint + บันทึกแล้ว).
- **Fields**: `card` background with a hairline ring. Hover turns the ring pink. Focus draws a deep-pink ring plus a `gum-tint` halo. An error tints the field cinnamon and puts one line under it saying what to do. Numbers are right-aligned with the unit as a muted suffix (`฿`, `%`, `฿/g`).
- **Chips**: ลิงก์ in `razz-tint`, พิมพ์เอง as a hairline outline, a category as a `paper-2` chip with its colour dot.
- **Profit readout**: a `mint-tint` card (or `cinnamon-tint` for a loss) with the label (กำไรสุทธิต่อแก้ว) above a `font-display` figure.
- **Sheet rows**: card rows that lift on hover, with the per-unit profit or loss at the right.
- **Empty state**: a dashed-border card that says what's missing and offers the one next step. **Alert**: one cinnamon-tint line saying what happened and why.

## Money and numbers

- Always two decimals: `Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`. Store figures as Postgres `numeric`, never as floats.
- Use tabular figures and right-align wherever numbers stack.
- Name the Sale Unit next to every per-sale figure: กำไรต่อแก้ว, never just กำไร.
- A loss gets three signals: the word ขาดทุน, a true minus sign (−), and `loss`. Colour alone never carries meaning.
- The baht sign follows the number: `13.95 ฿`, or `4 ฿/g` for a Unit Cost.
- Pink never appears on a number. Money is mint or cinnamon.
- Never show an invented figure. An empty state reads ยังไม่มี…

## Motion: press, chew, pop

Plain CSS, no motion library.

- Buttons press with `ease-press`: 140ms on hover, 70ms on press. No scaling.
- Pressable cards lift 3–4px with `ease-spring` over 220ms.
- The character is a gum bubble on the circle of กำ in the wordmark. It chews slowly (1 → 1.08 every 4s). A click pops it and it grows back. There is one per screen.
- A successful save fires one grape star-burst from the button, in 420ms. It never loops.
- Everything else (focus, chips, nav) changes colour only. Focus rings appear instantly.
- `prefers-reduced-motion: reduce`: nothing moves position, the bubble holds still, the star-burst is off, and colour changes take 120ms or less.

## Voice

Thai, warm and short: a friend who's good with numbers. Use the words in `CONTEXT.md` exactly (รายการต้นทุน, not สินค้า; กำไรสุทธิ, not มาร์จิ้น). Buttons are plain verbs: บันทึก, สร้างชีต, ทำสำเนา. Errors say what happened and what to do: ราคาขาย 40 ฿ ยังไม่พอจ่ายต้นทุน. The fun comes from the colour and the bubble, never from jokes, emoji or celebration toasts.

## Never

- Pink on a number, or a gradient between flavours.
- Pure white paper or pure black ink.
- Square corners, glass, blur or glow.
- Italics, uppercase, letter-spacing on Thai, or a heading line-height under 1.35.
- More than one bubble, or more than one pink push button, per screen.
- Emoji as icons.
- A colour written anywhere but the preset.

## Amending

Change a token in the preset, then update the matching swatch in `DESIGN.html` so the picture still matches. A new role needs a row here before any component uses it.
