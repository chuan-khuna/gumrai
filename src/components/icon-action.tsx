'use client'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from 'cn'

const TONES = {
  default: 'text-muted-foreground hover:text-foreground',
  link: 'text-link hover:bg-linked',
  destructive: 'text-muted-foreground hover:bg-loss-surface hover:text-destructive',
}

// A 36px ghost icon button whose action is named in a tooltip on hover or focus, and in its
// aria-label for screen readers (DESIGN.md § Icon actions). For a dense row of repeated
// actions, such as a sheet's cost lines, where words in every row would crowd the figures.
export function IconAction({
  label,
  icon,
  tone = 'default',
  className,
  ...props
}: {
  /** What the button does, as its tooltip and accessible name: เลิกลิงก์กับลิสต์ */
  label: string
  icon: React.ReactNode
  tone?: keyof typeof TONES
} & Omit<React.ComponentProps<typeof Button>, 'children' | 'variant' | 'size'>) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            className={cn(TONES[tone], className)}
            {...props}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// An icon that marks what something is, with its meaning on hover or focus, like a line's
// source (ลิงก์กับลิสต์ต้นทุน or พิมพ์เอง). Focusable so keyboards reach the tooltip too.
export function IconMark({
  label,
  icon,
  className,
}: {
  label: string
  icon: React.ReactNode
  className?: string
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            role="img"
            aria-label={label}
            className={cn(
              'inline-grid size-8 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring [&_svg]:size-4',
              className,
            )}
          >
            {icon}
          </span>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
