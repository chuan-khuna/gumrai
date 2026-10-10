import { cn } from 'cn'

// A labelled form control: the label above, in the muted label style (DESIGN.md § Inputs).
// Wrapping the control in the <label> ties them together without ids. `hideLabel` keeps the
// label for screen readers only, for a field whose heading already says what it is.
export function Field({
  label,
  hideLabel = false,
  className,
  children,
}: {
  label: React.ReactNode
  hideLabel?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn('grid min-w-0 gap-1.5', className)}>
      <span className={hideLabel ? 'sr-only' : 'text-sm text-muted-foreground'}>{label}</span>
      {children}
    </label>
  )
}
