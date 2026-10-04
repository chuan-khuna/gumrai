'use client'

import { useActionState } from 'react'
import { createCostSheetAction } from '@/app/sheets/actions'

// Names a new Cost Sheet and opens it.
export function CreateSheetForm() {
  const [state, formAction, pending] = useActionState(createCostSheetAction, {
    name: '',
    error: null,
  })

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="block min-w-0 flex-1">
        <span className="text-sm text-muted">ชื่อชีต</span>
        <input
          name="name"
          required
          placeholder="เช่น มัทฉะลาเต้"
          defaultValue={state.name}
          className="mt-1 w-full rounded border border-line bg-card px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-accent px-4 py-2 font-medium text-card disabled:opacity-60"
      >
        สร้าง
      </button>
      {state.error && (
        <p role="alert" className="w-full text-loss">
          {state.error}
        </p>
      )}
    </form>
  )
}
