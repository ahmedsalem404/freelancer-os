import type { ComponentProps } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

type Props = ComponentProps<typeof Button> & {
  /** While true the button is disabled and shows a spinner + "Saving…". */
  isPending?: boolean
  /** Replaces the default "Saving…" label while pending. */
  pendingText?: string
}

/** A submit/action button that blocks double clicks while a request runs. */
export function PendingButton({
  isPending = false,
  pendingText,
  disabled,
  children,
  ...props
}: Props) {
  const { t } = useTranslation()
  return (
    <Button disabled={disabled || isPending} aria-busy={isPending} {...props}>
      {isPending ? (
        <>
          <Loader2 className='animate-spin' aria-hidden />
          {pendingText ?? t('common.saving')}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
