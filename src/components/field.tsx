import { cn } from 'cn'

// A labelled form control: the label above, in the muted label style (DESIGN.md § Inputs).
// Wrapping the control in the <label> ties them together without ids.
export function Field({
  label,
  className,
  children,
}: {
  label: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn('grid min-w-0 gap-1.5', className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
