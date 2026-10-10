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
// works, and the action receives what they typed so the server can check it again.
type ConfirmActionProps = {
  trigger: string
  title: string
  description?: string
  confirmLabel: string
  /** The confirm button's text while the action runs. */
  pendingLabel?: string
  size?: 'sm' | 'default'
} & (
  | { typeToConfirm?: undefined; action: () => Promise<void> }
  | { typeToConfirm: string; action: (typed: string) => Promise<void> }
)

export function ConfirmAction(props: ConfirmActionProps) {
  const { trigger, title, description, confirmLabel, pendingLabel = 'กำลังลบ…', typeToConfirm, size = 'sm' } = props
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [pending, startTransition] = useTransition()
  const confirmed = typeToConfirm === undefined || typed === typeToConfirm

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        setOpen(next)
        setTyped('')
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
                // Only a typed confirmation is sent; other actions take no argument.
                await (props.typeToConfirm === undefined ? props.action() : props.action(typed))
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
