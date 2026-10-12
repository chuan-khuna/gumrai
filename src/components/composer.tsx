import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from 'cn'

// The slot a new thing is added in: a 2px dashed outline with no fill, which turns pink while
// the seller fills it. Things already saved are solid cards, so dashed always means "not made
// yet" (DESIGN.md § Card and money). A first-run composer adds a title and a description saying
// what's missing; otherwise the visible field labels and the button say what it is for.
export function Composer({
  title,
  description,
  className,
  children,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card
      className={cn(
        'border-2 border-dashed border-border bg-transparent shadow-none transition-colors duration-150 ease-out focus-within:border-primary',
        className,
      )}
    >
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  )
}
