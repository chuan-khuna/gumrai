import * as React from "react"
import { cn } from "cn"

// A text field: a card surface with a hairline ring that turns pink on hover and draws a pink
// focus ring. Money and quantities add `text-right tabular-nums` (DESIGN.md § Inputs).
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-base transition-[border-color,box-shadow] duration-150 ease-out outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-primary focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-accent disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:bg-loss-surface aria-invalid:ring-0",
        className
      )}
      {...props}
    />
  )
}

export { Input }
