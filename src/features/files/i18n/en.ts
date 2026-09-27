import type { Widen } from '@/shared/i18n/widen'
import type { filesAr } from './ar'

export const filesEn: Widen<typeof filesAr> = {
  files: {
    upload: 'Upload file',
    choose: 'Choose a file (PDF or image, up to 15 MB)',
    kindLabel: 'File type',
    note: 'Note',
    notePlaceholder: 'e.g. WhatsApp 12 Sep — agreed 3 revisions',
    uploading: 'Uploading…',
    uploaded: 'File uploaded',
    open: 'Open',
    nameOnly: 'Name only — no file',
    deleteHint: 'The file is deleted from this machine for good.',
    tooLarge: 'The file is over 15 MB',
    kind: {
      agreement_chat: 'Agreement screenshot',
      contract: 'Contract',
      payment_proof: 'Payment proof',
      receipt: 'Receipt',
      deliverable_file: 'Delivered file',
      logo: 'Logo',
      other: 'File',
    },
  },
}
