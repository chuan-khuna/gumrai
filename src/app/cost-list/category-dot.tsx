import { categoryColour } from '@/lib/category-colours'

// A Cost Category's colour swatch: a little gumball. A null slot is ไม่มีหมวด.
export function CategoryDot({ colourSlot }: { colourSlot: number | null }) {
  return (
    <span
      aria-hidden
      className="inline-block size-2.5 shrink-0 rounded-full"
      style={{ background: categoryColour(colourSlot) }}
    />
  )
}
