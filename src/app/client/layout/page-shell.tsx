import type { ReactNode } from 'react'
import { Main } from '@/app/client/layout/main'
import { cn } from '@/shared/lib/utils'
import { motion, useReducedMotion } from 'motion/react'
import { AppHeader } from './app-header'

type PageShellProps = {
  title: ReactNode
  subtitle?: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function PageShell({
  title,
  subtitle,
  eyebrow,
  actions,
  children,
  className,
}: PageShellProps) {
  const reduce = useReducedMotion()
  return (
    <>
      <AppHeader />
      <Main className={cn('pb-16', className)}>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className='grid gap-6'
        >
          <header className='flex flex-wrap items-end justify-between gap-4'>
            <div className='grid gap-1'>
              {eyebrow && (
                <div className='text-xs font-medium text-muted-foreground'>
                  {eyebrow}
                </div>
              )}
              <h1 className='font-display text-2xl font-semibold sm:text-[28px]'>
                {title}
              </h1>
              {subtitle && (
                <p className='max-w-prose text-sm text-muted-foreground'>
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className='flex flex-wrap items-center gap-2'>{actions}</div>
            )}
          </header>
          {children}
        </motion.div>
      </Main>
    </>
  )
}
