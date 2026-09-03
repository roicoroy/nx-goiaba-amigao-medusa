import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactNode } from "react"

/**
 * Create QueryClient as a module-level singleton
 * This ensures all widgets (including built-in Medusa widgets) share the same instance
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

/**
 * Admin Setup - Provides QueryClientProvider for all admin widgets and plugins
 * 
 * Medusa v2 admin looks for a `setup` export in src/admin/index.tsx
 * This provider wraps all admin extensions, including:
 * - Custom widgets and routes
 * - Plugin widgets (like wishlist-plugin)
 * - Built-in Medusa widgets that use React Query (like ProductWidget)
 * 
 * @param props - Contains children to wrap with QueryClientProvider
 */
export const setup = (props: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  )
}

