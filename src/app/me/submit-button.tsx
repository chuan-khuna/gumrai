'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

// A form's submit button that shows `pendingLabel` and turns itself off while the form's
// action runs, for an action with no state of its own to report, such as a redirect away.
export function SubmitButton({
  children,
  pendingLabel,
  variant,
  size,
}: {
  children: React.ReactNode
  pendingLabel: string
  variant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending} aria-busy={pending || undefined}>
      {pending ? pendingLabel : children}
    </Button>
  )
}
