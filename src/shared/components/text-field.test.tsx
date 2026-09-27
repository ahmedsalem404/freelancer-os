import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { TextField } from './text-field'

describe('TextField', () => {
  it('shows the hint and leaves the field valid', async () => {
    const { getByRole, getByText } = await render(
      <TextField
        id='f'
        label='Amount'
        value=''
        onChange={vi.fn()}
        hint='In USD'
      />
    )
    await expect.element(getByText('In USD')).toBeInTheDocument()
    await expect
      .element(getByRole('textbox', { name: 'Amount' }))
      .not.toHaveAttribute('aria-invalid')
  })

  it('shows the error instead of the hint and marks the field invalid', async () => {
    const { getByRole, getByText } = await render(
      <TextField
        id='f'
        label='Amount'
        value='0'
        onChange={vi.fn()}
        hint='In USD'
        error='Enter a number above zero'
      />
    )
    const field = getByRole('textbox', { name: 'Amount' })
    await expect.element(field).toHaveAttribute('aria-invalid', 'true')
    await expect
      .element(field)
      .toHaveAccessibleDescription('Enter a number above zero')
    await expect.element(getByText('In USD')).not.toBeInTheDocument()
  })
})
