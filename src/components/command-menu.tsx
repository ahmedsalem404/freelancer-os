import { useDb } from '@/app/client/snapshot-query'
import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Handshake, Moon, Sun, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSearch } from '@/context/search-provider'
import { useTheme } from '@/context/theme-provider'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { navSections } from './layout/nav'
import { ScrollArea } from './ui/scroll-area'

export function CommandMenu() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { setTheme } = useTheme()
  const { open, setOpen } = useSearch()
  const clients = useDb().clients
  const engagements = useDb().engagements

  const run = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t('common.searchHint')} />
      <CommandList>
        <ScrollArea type='hover' className='h-80 pe-1'>
          <CommandEmpty>{t('common.noResults')}</CommandEmpty>
          {navSections.map((section) => (
            <CommandGroup
              key={section.key}
              heading={t(`nav.groups.${section.key}`)}
            >
              {section.items.map((item) => (
                <CommandItem
                  key={item.key}
                  value={`${t(`nav.${item.key}`)} ${item.key}`}
                  onSelect={() => run(() => navigate({ to: item.url }))}
                >
                  <item.icon className='text-muted-foreground' />
                  {t(`nav.${item.key}`)}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading={t('nav.engagements')}>
            {engagements.map((e) => (
              <CommandItem
                key={e.id}
                value={`${e.title} ${e.id}`}
                onSelect={() =>
                  run(() =>
                    navigate({ to: '/engagements/$id', params: { id: e.id } })
                  )
                }
              >
                <Handshake className='text-muted-foreground' />
                {e.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading={t('nav.clients')}>
            {clients.map((c) => (
              <CommandItem
                key={c.id}
                value={`${c.name} ${c.company ?? ''} ${c.id}`}
                onSelect={() =>
                  run(() =>
                    navigate({ to: '/clients/$id', params: { id: c.id } })
                  )
                }
              >
                <Users className='text-muted-foreground' />
                {c.company ?? c.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={t('common.theme')}>
            <CommandItem onSelect={() => run(() => setTheme('light'))}>
              <Sun /> <span>{t('common.light')}</span>
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme('dark'))}>
              <Moon className='scale-90' />
              <span>{t('common.dark')}</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  )
}
