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
    unavailable: 'This link is not available',
    unavailableHint:
      'It may have been turned off or replaced. Ask for the current link.',
    link: {
      create: 'Create client link',
      regenerate: 'New link',
      revoke: 'Turn off link',
      active_one: 'Active link ending in {{hint}} · opened once · since {{date}}',
      active: 'Active link ending in {{hint}} · opened {{count}} times · since {{date}}',
      onceHint:
        'Copy the link now — for security it is never shown in full again. A new link turns the old one off.',
      revokeTitle: 'Turn off the client link?',
      revokeHint:
        'The current link stops opening. You can create a new one at any time.',
      revoked: 'Link turned off',
    },
  },
}
