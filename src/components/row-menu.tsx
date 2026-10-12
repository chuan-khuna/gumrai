'use client'

import { EllipsisIcon } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type RowMenuItem = {
  label: string
  icon: React.ReactNode
  onSelect: () => void
  /** The item opens something that takes focus (a rename field, a confirm dialog), so the
   * menu must not hand focus back to its button as it closes. */
  takesFocus?: boolean
}

// A row's actions behind one ⋯ button (DESIGN.md § Row actions). Everyday actions come first;
// `destructive` (ลบ) sits last, under a dashed rule, in cinnamon. Deleting still goes through
// `ConfirmAction`, which the row opens from `destructive.onSelect`.
export function RowMenu({
  label,
  items,
  destructive,
  disabled = false,
}: {
  /** Says whose menu this is, for screen readers: ตัวเลือกของชีต มัทฉะลาเต้ */
  label: string
  items: RowMenuItem[]
  destructive?: RowMenuItem
  disabled?: boolean
}) {
  const handedOff = useRef(false)
  const select = (item: RowMenuItem) => () => {
    handedOff.current = item.takesFocus ?? false
    item.onSelect()
  }

  return (
    // Not modal, so a confirm dialog opened from it doesn't fight the menu over the page.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className="text-muted-foreground hover:text-foreground aria-expanded:text-foreground"
        >
          <EllipsisIcon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        onCloseAutoFocus={(event) => {
          if (handedOff.current) event.preventDefault()
          handedOff.current = false
        }}
      >
        {items.map((item) => (
          <DropdownMenuItem key={item.label} onSelect={select(item)}>
            {item.icon}
            {item.label}
          </DropdownMenuItem>
        ))}
        {destructive && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={select(destructive)}>
              {destructive.icon}
              {destructive.label}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
