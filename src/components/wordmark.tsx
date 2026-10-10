'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from 'cn'

// The กำไร wordmark with the one character (DESIGN.md § The bubble): a gum bubble on the
// circle of กำ. It chews slowly; a click pops it with a grape star-burst and it grows back.
// Size it with a text size class; the bubble is placed in em so it follows. Use it once per
// screen, and never inside a link, because the bubble is a button.
type BubbleState = 'chewing' | 'popped' | 'regrowing'

const POP_MS = 420
const REGROW_MS = 520

export function Wordmark({ className }: { className?: string }) {
  const [state, setState] = useState<BubbleState>('chewing')
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  function pop() {
    if (state !== 'chewing') return
    setState('popped')
    timers.current.push(
      window.setTimeout(() => setState('regrowing'), POP_MS),
      window.setTimeout(() => setState('chewing'), POP_MS + REGROW_MS),
    )
  }

  return (
    <span lang="th" className={cn('relative inline-block font-heading leading-[1.25] font-semibold', className)}>
      <span className="sr-only">กำไร</span>
      <span aria-hidden="true">
        <span className="relative inline-block">
          กำ
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={pop}
            className={cn(
              'absolute top-[0.12em] left-[0.36em] size-[0.3em] origin-[50%_70%] cursor-pointer rounded-full border-0 bg-primary bg-[radial-gradient(circle_at_34%_30%,var(--color-card)_0_14%,transparent_15%)] p-0 shadow-[inset_-0.02em_-0.03em_0_var(--color-primary-edge)] transition-[scale] duration-200 ease-spring motion-reduce:animate-none motion-reduce:transition-none',
              state === 'chewing' && 'animate-chew hover:scale-135 hover:[animation-play-state:paused] motion-reduce:hover:scale-100',
              state === 'popped' && 'scale-135 animate-bubble-pop',
              state === 'regrowing' && 'animate-bubble-regrow',
            )}
          />
          {state === 'popped' && (
            <span className="pointer-events-none absolute top-[0.27em] left-[0.51em] size-[0.36em] -translate-1/2 motion-reduce:hidden">
              <span className="absolute inset-0 animate-star-burst before:absolute before:inset-x-0 before:top-[46%] before:h-[8%] before:rounded-full before:bg-pop after:absolute after:inset-y-0 after:left-[46%] after:w-[8%] after:rounded-full after:bg-pop" />
            </span>
          )}
        </span>
        ไร
      </span>
    </span>
  )
}
