import type { Widen } from '@/shared/i18n/widen'
import type { portalAr } from './ar'

export const portalEn: Widen<typeof portalAr> = {
  portal: {
    preparedBy: 'From {{name}}',
    progress: 'Progress',
    deliverables: 'Deliverables',
    approve: 'Approve this deliverable',
    approved: 'Approved',
    approvedToast: 'Approved — thank you',
    awaiting: 'Waiting for your approval',
    notice: "Preview — the client's secure link arrives in the next phase",
  },
}
