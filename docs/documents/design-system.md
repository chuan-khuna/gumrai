# Design system in code

This page describes how the visual design reaches the components. [DESIGN.md](../../DESIGN.md) defines the design itself, including the tokens, the reasons behind them, and guidance for each component. [DESIGN.html](../../DESIGN.html) shows it in a browser.

## Where tokens live

| File | Contents |
| --- | --- |
| `src/styles/globals.css` | Imports Tailwind, `tw-animate-css`, and the shadcn base styles, then the preset |
| `src/styles/presets/bubblegum.css` | An `@theme` block with every colour, font, radius, shadow, and easing, in OKLCH |
| `DESIGN.md` front matter | A copy of every preset token, value for value |

A token change goes into both the preset and `DESIGN.md`. No other file defines a colour.

The preset defines tokens in two layers:

1. The palette holds the neutrals (`paper` and `ink`) and six flavour colours, each with one job. Gum is for actions, mint for profit, razz for Linked Lines, cinnamon for loss, grape for the save, and lemon for the one highlighted figure.
2. The roles use shadcn's names, such as `background`, `primary`, and `muted-foreground`, plus Gumrai's own, such as `profit`, `loss`, `linked`, and `linked-foreground`. Each role points at a palette token.

Components use role utilities such as `bg-primary`, `text-profit`, and `bg-linked`, never palette utilities such as `bg-gum`. A new theme is a new preset file and a changed import in `globals.css`.

The app has a light theme only. `@custom-variant dark` ties shadcn's `dark:` classes to a `.dark` class that the app never sets.

## Fonts

`src/app/layout.tsx` loads two fonts through `next/font/google` and exposes them as CSS variables that the preset uses. IBM Plex Sans Thai Looped is the body font, and Mitr is the heading font. Headings have no letter spacing and a line height of 1.35, which leaves room for Thai tone marks.

## Components

| Path | Contents |
| --- | --- |
| `src/components/ui/` | shadcn/ui components on Radix, restyled to `DESIGN.md`. The shadcn CLI adds new ones with `bunx shadcn@<version> add <name>`, where the version is at least 7 days old. Each new component is restyled before use. |
| `src/components/option-select.tsx` | `OptionSelect`, used for every dropdown. An option can show a category colour dot. |
| `src/components/confirm-action.tsx` | `ConfirmAction`, used for every delete. It opens an alert dialog, runs the server action only after the seller confirms, and stays open until the action finishes. With `typeToConfirm` (deleting the account uses `delete`), its confirm button stays disabled until the seller types that text exactly, and the action receives what they typed. |
| `src/components/field.tsx` | `Field`, a label with its control |

## Cost Category colours

Sellers never choose colours. `createCostCategory` gives each new category the lowest `colour_slot` that no other category holds, so the colour of a deleted category is reused first. `categoryColour(slot)` in `src/lib/category-colours.ts` returns `var(--color-category-N)`. A slot beyond the palette wraps round to the start. A `null` slot, for ไม่มีหมวด, returns `var(--color-category-none)`.

`CATEGORY_PALETTE_SIZE` is 8, which equals the number of `--color-category-N` tokens in the preset. The palette avoids the hues of loss and profit, so a category colour never looks like either.

## Language of the UI

The UI is in Thai only, and amounts are in baht only. There is no translation layer. Code and documents use the English domain terms from [GLOSSARY.md](../../GLOSSARY.md). The UI shows the Thai term that the glossary gives beside each one.
