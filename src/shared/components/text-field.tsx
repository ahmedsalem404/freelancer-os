import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Props = Omit<ComponentProps<'input'>, 'onChange' | 'value'> & {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  /** Renders a textarea instead of a one-line input. */
  isMultiline?: boolean
  hint?: string
}

/** A labelled text input for dialogs and forms. */
export function TextField({
  id,
  label,
  value,
  onChange,
  isMultiline,
  hint,
  ...inputProps
}: Props) {
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <div className='grid gap-2'>
      <Label htmlFor={id}>{label}</Label>
      {isMultiline ? (
        <Textarea
          id={id}
          rows={3}
          value={value}
          aria-describedby={hintId}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          value={value}
          aria-describedby={hintId}
          onChange={(e) => onChange(e.target.value)}
          {...inputProps}
        />
      )}
      {hint && (
        <p id={hintId} className='text-xs text-muted-foreground'>
          {hint}
        </p>
      )}
    </div>
  )
}
