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
    form: {
      add: 'New lead',
      addTitle: 'New lead',
      editTitle: 'Edit lead',
      hint: 'Record who reached out, then track them across the board.',
      name: 'Name',
      company: 'Company or shop (optional)',
      service: 'Service wanted',
      currency: 'Currency',
      followUp: 'Follow-up date',
      sourcePlaceholder: 'e.g. Instagram, referral',
      notes: 'Notes',
      added: 'Lead added',
      saved: 'Changes saved',
      deleteHint:
        'Removed from the board for good. Clients you already won stay.',
    },
    convert: {
      title: 'Convert {{name}} to a client',
      hint: 'Winning opens the client and the engagement together — you can edit details later.',
      engagementTitle: 'Engagement title',
      type: 'Engagement type',
      amount: 'Amount',
      period: 'Billing period',
      monthly: 'Monthly',
      yearly: 'Yearly',
      startOn: 'Start date',
      submit: 'Convert and open the engagement',
      done: '{{name}} is now a client — engagement opened',
    },
  },
}
