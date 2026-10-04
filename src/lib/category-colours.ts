// Cost Category colours come from a fixed palette, defined as OKLCH tokens in globals.css
// (--color-category-0 …). A category's colour slot picks one; slots past the end wrap round.
// The seller never picks a colour. ไม่มีหมวด has its own neutral one.

// Keep in step with the --color-category-N tokens in src/app/globals.css.
export const CATEGORY_PALETTE_SIZE = 8

// A CSS colour for a Cost Category's slot, or for ไม่มีหมวด when the slot is null.
export function categoryColour(colourSlot: number | null): string {
  if (colourSlot === null) return 'var(--color-category-none)'
  return `var(--color-category-${colourSlot % CATEGORY_PALETTE_SIZE})`
}

export const UNCATEGORISED = 'ไม่มีหมวด'
