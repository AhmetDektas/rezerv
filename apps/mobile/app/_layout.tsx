import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, retry: 1 },
  },
})

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="business/[slug]" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="auth/login" options={{ headerShown: true, title: 'Giriş Yap' }} />
            <Stack.Screen name="auth/register" options={{ headerShown: true, title: 'Kayıt Ol' }} />
            <Stack.Screen name="vet/pixel-art/[petId]" options={{ headerShown: true, title: 'Pixel Art Oluştur' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
