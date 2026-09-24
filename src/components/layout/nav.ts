import {
  CalendarDays,
  Calculator,
  Clock3,
  Handshake,
  Inbox,
  type LucideIcon,
  Settings,
  Sun,
  Users,
  Wallet,
} from 'lucide-react'

export type NavEntry = {
  /** i18n key under `nav.` */
  key: string
  url: string
  icon: LucideIcon
}

export type NavSection = { key: 'work' | 'money' | 'tools'; items: NavEntry[] }

export const navSections: NavSection[] = [
  {
    key: 'work',
    items: [
      { key: 'today', url: '/', icon: Sun },
      { key: 'engagements', url: '/engagements', icon: Handshake },
      { key: 'clients', url: '/clients', icon: Users },
      { key: 'leads', url: '/leads', icon: Inbox },
      { key: 'calendar', url: '/calendar', icon: CalendarDays },
    ],
  },
  {
    key: 'money',
    items: [
      { key: 'finance', url: '/finance', icon: Wallet },
      { key: 'time', url: '/time', icon: Clock3 },
    ],
  },
  {
    key: 'tools',
    items: [
      { key: 'pricing', url: '/pricing', icon: Calculator },
      { key: 'settings', url: '/settings', icon: Settings },
    ],
  },
]
