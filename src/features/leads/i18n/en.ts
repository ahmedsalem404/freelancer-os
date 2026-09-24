import type { Widen } from '@/shared/i18n/widen'
import type { leadsAr } from './ar'

export const leadsEn: Widen<typeof leadsAr> = {
  leadStage: {
    lead: 'Lead',
    proposal: 'Proposal sent',
    negotiation: 'Negotiation',
    won: 'Won',
    lost: 'Lost',
  },
  leads: {
    title: 'Leads',
    subtitle: 'Follow every quote so no one gets lost in the chats.',
    estimate: 'Estimate',
    source: 'Source',
    stale_one: 'No follow-up for 1 day',
    stale: 'No follow-up for {{count}} days',
    moved: 'Moved to “{{stage}}”',
    dragHint: 'Drag cards between columns',
  },
}
