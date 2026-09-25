import '@/app/client/i18n'
import { SearchProvider } from '@/shared/context/search-provider'
import i18n from 'i18next'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { CommandMenu } from './command-menu'

const PLACEHOLDER = 'Search or jump to a page'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  setTheme: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  }
})

// The menu lists clients and engagements from the snapshot.
vi.mock('@/app/client/snapshot-query', () => ({
  useDb: () => ({
    clients: [{ id: 'c1', name: 'Sara Ali', company: 'Nakhla Studio' }],
    engagements: [{ id: 'e1', title: 'Brand refresh' }],
  }),
}))

vi.mock('@/shared/context/theme-provider', () => ({
  useTheme: () => ({ setTheme: mocks.setTheme }),
}))

type ShortcutModifier = 'Control' | 'Meta'

async function renderMenu() {
  return await render(
    <SearchProvider>
      <CommandMenu />
    </SearchProvider>
  )
}

/**
 * Open the palette by shortcut, retrying while the keydown listener may not be mounted yet.
 * Waits between attempts so a successful toggle is not immediately undone by a second chord.
 */
async function openPalette(
  screen: RenderResult,
  modifier: ShortcutModifier = 'Control'
) {
  await vi.waitFor(
    async () => {
      const isOpen =
        document.querySelector(`[placeholder="${PLACEHOLDER}"]`) !== null

      if (!isOpen) {
        await userEvent.keyboard(`{${modifier}>}k{/${modifier}}`)
      }

      await expect
        .element(screen.getByPlaceholder(PLACEHOLDER))
        .toBeInTheDocument()
    },
    { interval: 50, timeout: 5000 }
  )
}

async function expectClosed(screen: RenderResult) {
  await expect
    .element(screen.getByPlaceholder(PLACEHOLDER))
    .not.toBeInTheDocument()
}

describe('CommandMenu', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('en')
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists pages, engagements, clients and themes when open', async () => {
    const screen = await renderMenu()

    await openPalette(screen)

    await expect.element(screen.getByText('Today')).toBeInTheDocument()
    await expect.element(screen.getByText('Leads')).toBeInTheDocument()
    await expect.element(screen.getByText('Brand refresh')).toBeInTheDocument()
    await expect.element(screen.getByText('Nakhla Studio')).toBeInTheDocument()
    await expect.element(screen.getByText('Light')).toBeInTheDocument()
    await expect.element(screen.getByText('Dark')).toBeInTheDocument()
  })

  it('stays closed until the shortcut is pressed', async () => {
    const screen = await renderMenu()

    await expectClosed(screen)
  })

  it.each([
    ['Ctrl', 'Control'],
    ['Cmd', 'Meta'],
  ] as const)('opens when %s + K is pressed', async (_label, modifier) => {
    const screen = await renderMenu()

    await expectClosed(screen)
    await openPalette(screen, modifier)
  })

  it('navigates to a page and closes', async () => {
    const screen = await renderMenu()
    await openPalette(screen)

    await userEvent.click(screen.getByText('Leads'))

    expect(mocks.navigate).toHaveBeenCalledWith({ to: '/leads' })
    await expectClosed(screen)
  })

  it('opens an engagement by id', async () => {
    const screen = await renderMenu()
    await openPalette(screen)

    await userEvent.click(screen.getByText('Brand refresh'))

    expect(mocks.navigate).toHaveBeenCalledWith({
      to: '/engagements/$id',
      params: { id: 'e1' },
    })
    await expectClosed(screen)
  })

  it('opens a client by id', async () => {
    const screen = await renderMenu()
    await openPalette(screen)

    await userEvent.click(screen.getByText('Nakhla Studio'))

    expect(mocks.navigate).toHaveBeenCalledWith({
      to: '/clients/$id',
      params: { id: 'c1' },
    })
    await expectClosed(screen)
  })

  it('applies a theme and closes', async () => {
    const screen = await renderMenu()
    await openPalette(screen)

    await userEvent.click(screen.getByText('Dark'))

    expect(mocks.setTheme).toHaveBeenCalledWith('dark')
    await expectClosed(screen)
  })

  it('shows the empty state when nothing matches', async () => {
    const screen = await renderMenu()
    await openPalette(screen)

    await userEvent.fill(
      screen.getByPlaceholder(PLACEHOLDER),
      'zzzz-no-match-xxxx'
    )

    await expect.element(screen.getByText('No results')).toBeInTheDocument()
  })
})
