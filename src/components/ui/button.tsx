import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// Gumrai's buttons (DESIGN.md § Components). `default` is the pink push button: a solid edge
// underneath that lifts on hover and presses down on click, so the press is the feedback.
// One per screen. `keep` is the mint push for "keep this". The rest are quiet.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent font-heading font-medium whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-150 ease-press outline-none select-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 motion-reduce:transition-colors motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_4px_0_0_var(--color-primary-edge)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_var(--color-primary-edge)] active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--color-primary-edge)] active:duration-75",
        keep:
          "bg-keep text-foreground shadow-[0_4px_0_0_var(--color-keep-edge)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_var(--color-keep-edge)] active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--color-keep-edge)] active:duration-75",
        secondary:
          "bg-card text-foreground shadow-card hover:-translate-y-0.5 hover:shadow-lift active:translate-y-px active:shadow-card",
        outline:
          "border-border bg-transparent text-foreground hover:border-primary-edge hover:bg-accent aria-expanded:bg-accent",
        ghost: "text-foreground hover:bg-accent aria-expanded:bg-accent",
        destructive:
          "border-border bg-transparent text-destructive hover:border-destructive hover:bg-loss-surface focus-visible:ring-destructive",
        link: "font-sans text-link underline underline-offset-4 hover:text-foreground",
      },
      size: {
        default: "h-11 gap-2 px-5 text-base",
        sm: "h-9 gap-1.5 px-4 text-sm",
        xs: "h-7 gap-1 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        lg: "h-12 gap-2 px-6 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
