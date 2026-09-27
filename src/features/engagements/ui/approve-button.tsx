import { useState } from 'react'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useApproveDeliverable } from '../api/use-deliverable-actions'

type Props = { deliverableId: string; name: string }

/** Approving closes the deliverable for good, so it asks first. */
export function ApproveButton({ deliverableId, name }: Props) {
  const { t } = useTranslation()
  const approve = useApproveDeliverable()
  const [isConfirming, setIsConfirming] = useState(false)

  const confirm = () =>
    approve.mutate(
      { deliverableId, source: 'owner' },
      {
        onSuccess: () => {
          setIsConfirming(false)
          toast.success(t('engagements.approvedToast'))
        },
      }
    )

  return (
    <>
      <Button size='sm' variant='ghost' onClick={() => setIsConfirming(true)}>
        <Check /> {t('engagements.approve')}
      </Button>
      <ConfirmDialog
        open={isConfirming}
        onOpenChange={setIsConfirming}
        title={t('engagements.approveTitle', { name })}
        desc={t('engagements.approveHint')}
        confirmText={t('engagements.approve')}
        isLoading={approve.isPending}
        handleConfirm={confirm}
      />
    </>
  )
}
