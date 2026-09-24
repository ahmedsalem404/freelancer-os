import { engagementMeter } from '@/features/engagements/model/meter'
import { useDb } from '@/app/client/snapshot-query'
import { todayIso } from '@/shared/model/dates'
import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { navSections } from './nav'

function BrandMark() {
  const { t } = useTranslation()
  return (
    <Link
      to='/'
      className='flex items-center gap-2.5 rounded-lg px-1.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring'
    >
      <span className='relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-primary text-primary-foreground'>
        <span className='num text-[11px] font-semibold tracking-tight'>OS</span>
        <span className='absolute inset-x-0 bottom-0 h-1.5 hatch-billable opacity-90' />
      </span>
      <span className='grid leading-tight group-data-[collapsible=icon]:hidden'>
        <span className='font-display text-[15px] font-semibold'>
          Freelancer OS
        </span>
        <span className='truncate text-[11px] text-muted-foreground'>
          {t('app.tagline')}
        </span>
      </span>
    </Link>
  )
}

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { t } = useTranslation()
  const { setOpenMobile } = useSidebar()
  const pathname = useLocation({ select: (l) => l.pathname })
  const db = useDb()
  const owner = db.team[0]
  const overCount = db.engagements.filter(
    (e) => engagementMeter(db, e, todayIso()).unbilled > 0
  ).length

  const isActive = (url: string) =>
    url === '/' ? pathname === '/' : pathname.startsWith(url)

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <BrandMark />
      </SidebarHeader>
      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.key}>
            <SidebarGroupLabel>
              {t(`nav.groups.${section.key}`)}
            </SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={t(`nav.${item.key}`)}
                  >
                    <Link to={item.url} onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span>{t(`nav.${item.key}`)}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.key === 'engagements' && overCount > 0 && (
                    <SidebarMenuBadge className='num rounded-full bg-billable-soft text-billable-foreground'>
                      {overCount}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className='flex items-center gap-2.5 rounded-lg p-1.5'>
          <span className='grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground'>
            {owner.name.slice(0, 1)}
          </span>
          <span className='grid leading-tight group-data-[collapsible=icon]:hidden'>
            <span className='text-sm font-medium'>{owner.name}</span>
            <span className='text-xs text-muted-foreground'>
              {t(`settings.roles.${owner.role}`).split('—')[0]}
            </span>
          </span>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
