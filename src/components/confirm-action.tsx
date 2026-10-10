'use client'

import { useState, useTransition } from 'react'
import { Field } from '@/components/field'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// A destructive button that asks first. The server action runs only once the seller confirms;
// the dialog stays open, its button pending, until the action finishes or redirects.
//
// With `typeToConfirm`, the seller must also type that text exactly before the confirm button
// works, and the action receives what they typed so the server can check it again. With
// `passwordLabel`, they must enter their password in a field with that label, and the action
// receives it.
//
// An action may resolve to a Thai message: the dialog then stays open and shows it, as for a
// wrong password.
type ConfirmActionProps = {
  trigger: string
  title: string
  description?: string
  confirmLabel: string
  /** The confirm button's text while the action runs, such as กำลังลบ… */
  pendingLabel: string
  size?: 'sm' | 'default'
} & (
  | { typeToConfirm?: undefined; passwordLabel?: undefined; action: () => Promise<string | void> }
  | { typeToConfirm: string; passwordLabel?: undefined; action: (typed: string) => Promise<string | void> }
  | { typeToConfirm?: undefined; passwordLabel: string; action: (password: string) => Promise<string | void> }
)

export function ConfirmAction(props: ConfirmActionProps) {
  const { trigger, title, description, confirmLabel, pendingLabel, typeToConfirm, passwordLabel, size = 'sm' } = props
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const confirmed =
    typeToConfirm !== undefined ? typed === typeToConfirm : passwordLabel !== undefined ? typed !== '' : true

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        setOpen(next)
        setTyped('')
        setError(null)
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size={size}>
          {trigger}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {typeToConfirm !== undefined && (
          <Field label={`พิมพ์ ${typeToConfirm} เพื่อยืนยัน`}>
            <Input
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              disabled={pending}
            />
          </Field>
        )}
        {passwordLabel !== undefined && (
          <Field label={passwordLabel}>
            <Input
              type="password"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="current-password"
              aria-invalid={error ? true : undefined}
              disabled={pending}
            />
          </Field>
        )}
        {error && (
          <p role="alert" className="text-sm text-loss">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel variant="secondary" disabled={pending}>
            ยกเลิก
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending || !confirmed}
            onClick={(event) => {
              event.preventDefault()
              if (!confirmed) return
              startTransition(async () => {
                // Only typed text or a password is sent; other actions take no argument.
                const asked = props.typeToConfirm !== undefined || props.passwordLabel !== undefined
                const message = await (asked ? props.action(typed) : props.action())
                if (message) {
                  setError(message)
                  return
                }
                setOpen(false)
              })
            }}
          >
            {pending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
