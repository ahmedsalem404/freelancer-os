import { cn } from '@/shared/lib/utils'
import { Label } from '@/components/ui/label'

type Props<T extends string> = {
  label: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  labelOf: (value: T) => string
}

/** A labelled segmented choice (radio group) for a few options. */
export function ChoiceRow<T extends string>({
  label,
  options,
  value,
  onChange,
  labelOf,
}: Props<T>) {
  return (
    <div className='grid gap-2'>
      <Label>{label}</Label>
      <div
        role='radiogroup'
        aria-label={label}
        className='grid auto-cols-fr grid-flow-col gap-1 rounded-md border bg-muted/40 p-1'
      >
        {options.map((option) => (
          <button
            key={option}
            type='button'
            role='radio'
            aria-checked={value === option}
            onClick={() => onChange(option)}
            className={cn(
              'rounded-[5px] px-2 py-1.5 text-sm transition-colors',
              value === option
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {labelOf(option)}
          </button>
        ))}
      </div>
    </div>
  )
}
