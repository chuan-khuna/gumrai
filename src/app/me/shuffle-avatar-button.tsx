'use client'

import { Dices } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { shuffleAvatarPatternAction } from '@/app/me/actions'

// A dice that sits on the avatar's edge. It tumbles while the new pattern is fetched, so the
// press reads as a throw. Each press gives a new random seed.
function Dice() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="สุ่มลายใหม่"
      title="สุ่มลายใหม่"
      className="grid size-10 place-items-center rounded-full border-2 border-background bg-card text-foreground shadow-card transition-[transform,box-shadow] duration-150 ease-press outline-none hover:-translate-y-0.5 hover:shadow-lift focus-visible:ring-3 focus-visible:ring-ring active:translate-y-px disabled:cursor-progress motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <Dices
        aria-hidden
        className={`size-5 text-primary-edge ${pending ? 'animate-spin motion-reduce:animate-none' : ''}`}
      />
    </button>
  )
}

export function ShuffleAvatarButton({ className }: { className?: string }) {
  return (
    <form action={shuffleAvatarPatternAction} className={className}>
      <Dice />
    </form>
  )
}
