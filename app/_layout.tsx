
import { StatusBar } from 'expo-status-bar';
import { Stack, usePathname } from 'expo-router';
import { commonStyles } from '../styles/commonStyles';
import { useEffect } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { setupErrorLogging } from '../utils/errorLogger';
import { Platform, SafeAreaView } from 'react-native';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  useEffect(() => {
    setupErrorLogging();
  }, []);

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <RootLayoutInner />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

function RootLayoutInner() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  console.log('RootLayout rendered with pathname:', pathname);

  return (
    <SafeAreaView style={[commonStyles.wrapper, { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="role-selection" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="player-picks" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="season-leaderboard" />
        <Stack.Screen name="stats" />
        <Stack.Screen name="deploy" />
      </Stack>
      <StatusBar style="light" backgroundColor="transparent" translucent />
    </SafeAreaView>
  );
}
