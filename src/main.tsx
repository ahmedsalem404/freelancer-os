import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
// i18n must initialize before the first render
import '@/app/client/i18n'
import { DirectionProvider } from '@/shared/context/direction-provider'
import { FontProvider } from '@/shared/context/font-provider'
import { ThemeProvider } from '@/shared/context/theme-provider'
import { ApiError } from '@/shared/http/api-client'
import { handleServerError } from '@/shared/lib/handle-server-error'
import i18n from 'i18next'
import { toast } from 'sonner'
// Generated Routes
import { routeTree } from './routeTree.gen'
// Styles
import './styles/index.css'

/** The API said the session is gone: forget private data, go sign in. */
function isSessionEnded(error: unknown) {
  return error instanceof ApiError && error.code === 'unauthenticated'
}

function toSignIn() {
  if (router.state.location.pathname === '/sign-in') return
  toast.error(i18n.t('auth.sessionEnded'))
  queryClient.clear()
  const redirect = router.state.location.href
  void router.navigate({ to: '/sign-in', search: { redirect } })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry flaky network in production, never a clear 4xx answer.
      retry: (failures, error) =>
        import.meta.env.PROD &&
        failures < 3 &&
        !(error instanceof ApiError && error.status < 500),
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        if (isSessionEnded(error)) return toSignIn()
        handleServerError(error)
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (isSessionEnded(error)) toSignIn()
    },
  }),
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
            <DirectionProvider>
              <RouterProvider router={router} />
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
