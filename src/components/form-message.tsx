import { cn } from 'cn'

// What a form says after it is sent, on its own line after the submit button (DESIGN.md
// § Forms): an error in `loss` that names the problem, or a quiet confirmation once saved.
export function FormMessage({
  error,
  saved = null,
  className,
}: {
  error: string | null
  /** The confirmation to show once saved, such as บันทึกชื่อที่แสดงแล้ว */
  saved?: string | null
  className?: string
}) {
  if (error) {
    return (
      <p role="alert" className={cn('w-full text-sm text-loss', className)}>
        {error}
      </p>
    )
  }
  if (!saved) return null
  return (
    <p role="status" className={cn('w-full text-sm text-muted-foreground', className)}>
      {saved}
    </p>
  )
}
