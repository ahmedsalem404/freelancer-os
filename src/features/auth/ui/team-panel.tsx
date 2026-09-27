import { useState } from 'react'
import { useDb } from '@/app/client/snapshot-query'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { Panel } from '@/shared/components/panel'
import { cn } from '@/shared/lib/utils'
import {
  KeyRound,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  UserPlus,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TeamMember } from '@/features/settings/model/settings.schema'
import { useSetActive } from '../api/use-team'
import { MemberDialog, type MemberDialogMode } from './member-dialog'

/** Owner + assistants: add one, rename, reset a password, stop or restart. */
export function TeamPanel() {
  const { t } = useTranslation()
  const team = useDb().team
  const setActive = useSetActive()
  const [dialog, setDialog] = useState<MemberDialogMode>()
  const [stopping, setStopping] = useState<TeamMember>()

  const restart = (member: TeamMember) =>
    setActive.mutate(
      { id: member.id, isActive: true },
      { onSuccess: () => toast.success(t('team.restarted')) }
    )

  const statusOf = (m: TeamMember) =>
    !m.isActive ? 'stopped' : m.hasPassword ? 'active' : 'noPassword'

  return (
    <Panel
      title={t('settings.team')}
      bodyClassName='grid gap-2'
      action={
        <Button
          size='sm'
          variant='outline'
          onClick={() => setDialog({ kind: 'add' })}
        >
          <UserPlus /> {t('team.add')}
        </Button>
      }
    >
      {team.map((member) => (
        <div
          key={member.id}
          className={cn(
            'flex items-center justify-between gap-3 rounded-lg border p-3 text-sm',
            !member.isActive && 'opacity-60'
          )}
        >
          <div className='flex min-w-0 items-center gap-3'>
            <span className='grid size-8 shrink-0 place-items-center rounded-full bg-accent font-semibold text-accent-foreground'>
              {member.name.slice(0, 1)}
            </span>
            <span className='grid min-w-0'>
              <span className='truncate font-medium'>{member.name}</span>
              <span
                dir='ltr'
                className='truncate text-xs text-muted-foreground'
              >
                {member.email}
              </span>
            </span>
          </div>
          <div className='flex shrink-0 items-center gap-2'>
            <span className='text-xs text-muted-foreground'>
              {member.role === 'owner'
                ? t('settings.roles.owner')
                : t(`team.status.${statusOf(member)}`)}
            </span>
            {member.role === 'assistant' && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-8'
                    aria-label={t('common.more')}
                    disabled={setActive.isPending}
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem
                    onSelect={() => setDialog({ kind: 'edit', member })}
                  >
                    <Pencil /> {t('team.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setDialog({ kind: 'password', member })}
                  >
                    <KeyRound /> {t('team.setPassword')}
                  </DropdownMenuItem>
                  {member.isActive ? (
                    <DropdownMenuItem
                      variant='destructive'
                      onSelect={() => setStopping(member)}
                    >
                      <Pause /> {t('team.stop')}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={() => restart(member)}>
                      <Play /> {t('team.restart')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      ))}
      {dialog && (
        <MemberDialog mode={dialog} onClose={() => setDialog(undefined)} />
      )}
      <ConfirmDialog
        open={stopping !== undefined}
        onOpenChange={(open) => !open && setStopping(undefined)}
        destructive
        title={t('team.stopTitle', { name: stopping?.name })}
        desc={t('team.stopHint')}
        confirmText={t('team.stop')}
        isLoading={setActive.isPending}
        handleConfirm={() =>
          stopping &&
          setActive.mutate(
            { id: stopping.id, isActive: false },
            {
              onSuccess: () => {
                setStopping(undefined)
                toast.success(t('team.stopped'))
              },
            }
          )
        }
      />
    </Panel>
  )
}
