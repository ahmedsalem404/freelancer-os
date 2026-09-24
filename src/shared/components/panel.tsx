import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

type PanelProps = {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
}: PanelProps) {
  return (
    <section
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-[0_1px_0_rgba(13,31,36,0.04)]',
        className
      )}
    >
      {(title || action) && (
        <div className='flex items-center justify-between gap-3 border-b px-4 py-3'>
          <h2 className='text-sm font-semibold'>{title}</h2>
          {action}
        </div>
      )}
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  )
}
