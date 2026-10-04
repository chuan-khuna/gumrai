'use client'

import { useState } from 'react'
import { CategoryDot } from '@/app/cost-list/category-dot'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Radix Select reserves the empty string, but our forms use '' for "none" (ไม่มีหมวด, ทุกหมวด).
// This stands in for it inside the Select and turns back into '' on the way out.
const EMPTY = '__empty__'
const toSelect = (value: string) => (value === '' ? EMPTY : value)
const fromSelect = (value: string) => (value === EMPTY ? '' : value)

export type Option = {
  value: string
  label: string
  // A Cost Category's colour slot, to show its dot; null is ไม่มีหมวด; leave out for no dot.
  dot?: number | null
}

// The themed dropdown. Controlled with `value`, or uncontrolled from `defaultValue`. With
// `name` it posts the real value (never the stand-in) through a hidden input, so server
// actions read it like any field.
export function OptionSelect({
  options,
  name,
  value,
  defaultValue = '',
  onValueChange,
  size = 'default',
  className,
  'aria-label': ariaLabel,
}: {
  options: Option[]
  name?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  size?: 'sm' | 'default'
  className?: string
  'aria-label'?: string
}) {
  const [own, setOwn] = useState(defaultValue)
  const current = value ?? own

  return (
    <>
      <Select
        value={toSelect(current)}
        onValueChange={(next) => {
          const real = fromSelect(next)
          setOwn(real)
          onValueChange?.(real)
        }}
      >
        <SelectTrigger size={size} aria-label={ariaLabel} className={className}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={toSelect(option.value)}>
              {option.dot !== undefined && <CategoryDot colourSlot={option.dot} />}
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {name !== undefined && <input type="hidden" name={name} value={current} />}
    </>
  )
}
