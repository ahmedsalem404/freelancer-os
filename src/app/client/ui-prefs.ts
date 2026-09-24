import { BASE_CURRENCY, type Currency } from '@/shared/money/currency'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type UiPrefs = {
  /** Currency every report total is shown in (per device). */
  displayCurrency: Currency
  setDisplayCurrency: (currency: Currency) => void
}

/** View preferences only — business data lives in the snapshot query. */
export const useUiPrefs = create<UiPrefs>()(
  persist(
    (set) => ({
      displayCurrency: BASE_CURRENCY,
      setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),
    }),
    {
      name: 'fos-ui-prefs',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
