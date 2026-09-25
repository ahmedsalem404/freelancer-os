/** One editable invoice line; numbers stay text until submit. */
export type LineDraft = {
  key: number
  description: string
  quantity: string
  price: string
}

let nextKey = 0

export const emptyLine = (): LineDraft => ({
  key: nextKey++,
  description: '',
  quantity: '1',
  price: '',
})
