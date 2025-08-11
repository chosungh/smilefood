import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AppProvider, useAppContext } from '../contexts/AppContext';

// 인증 상태를 확인하는 컴포넌트
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAppContext();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const currentSegment = segments[0];
    
    // 현재 세그먼트가 유효한지 확인
    if (!currentSegment) return;
    
    const inProtectedGroup = currentSegment === 'main' || currentSegment === 'settings' || currentSegment === 'delete-account' || currentSegment === 'login-history';

    if (!isLoggedIn && inProtectedGroup) {
      // 로그인되지 않은 상태에서 보호된 화면에 접근하려고 하면 로그인 화면으로 리다이렉트
      // 무한 루프 방지를 위해 현재 세그먼트가 이미 login이 아닐 때만 리다이렉트
      if (currentSegment !== 'login') {
        router.replace('/login');
      }
    } else if (isLoggedIn && currentSegment === 'login') {
      // 이미 로그인된 상태에서 로그인 화면에 접근하려고 하면 메인 화면으로 리다이렉트
      router.replace('/main');
    }
  }, [isLoggedIn, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  return (
    <AppProvider>
      <AuthGuard>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="main" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="delete-account" />
            <Stack.Screen name="login-history" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      </AuthGuard>
    </AppProvider>
  );
}
