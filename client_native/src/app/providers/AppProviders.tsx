import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { PropsWithChildren, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/features/auth/context/AuthContext";
import { AppThemeProvider } from "@/theme/ThemeProvider";
import { ToastProvider } from "@/components/feedback/ToastProvider";
import { asyncStoragePersister } from "@/services/storage/queryPersister";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            gcTime: 24 * 60 * 60_000, // 24h — keep cached data longer for offline
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister, maxAge: 24 * 60 * 60_000 }}
      >
        <SafeAreaProvider>
          <AuthProvider>
            <AppThemeProvider>
              <ToastProvider>{children}</ToastProvider>
            </AppThemeProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
