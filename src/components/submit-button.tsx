'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

// Every form's submit button (DESIGN.md § Forms): the pink push, which shows `pendingLabel`
// (กำลัง…) and turns itself off while the form's action runs. `size="sm"` is for a form inside
// a list row; `variant="outline"` for a row action that sends no typed input, such as ผูก Discord.
export function SubmitButton({
  children,
  pendingLabel,
  variant = 'default',
  size = 'default',
  className,
}: {
  children: React.ReactNode
  pendingLabel: string
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm'
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={pending}
      aria-busy={pending || undefined}
      className={className}
    >
      {pending ? pendingLabel : children}
    </Button>
  )
}
