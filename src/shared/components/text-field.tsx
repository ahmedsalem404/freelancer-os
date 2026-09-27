import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'
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
  /** Shown instead of the hint, in red, and marks the field invalid. */
  error?: string
}

/** A labelled text input for dialogs and forms. */
export function TextField({
  id,
  label,
  value,
  onChange,
  isMultiline,
  hint,
  error,
  ...inputProps
}: Props) {
  const note = error ?? hint
  const noteId = note ? `${id}-hint` : undefined
  const isInvalid = error ? true : undefined
  return (
    <div className='grid gap-2'>
      <Label htmlFor={id}>{label}</Label>
      {isMultiline ? (
        <Textarea
          id={id}
          rows={3}
          value={value}
          aria-describedby={noteId}
          aria-invalid={isInvalid}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          value={value}
          aria-describedby={noteId}
          aria-invalid={isInvalid}
          onChange={(e) => onChange(e.target.value)}
          {...inputProps}
        />
      )}
      {note && (
        <p
          id={noteId}
          className={cn(
            'text-xs',
            error ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {note}
        </p>
      )}
    </div>
  )
}
