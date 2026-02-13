import { AppProvider } from '@/contexts/AppContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import '@/utils/globalErrorHandler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, TextInput, View } from 'react-native';
import '../global.css';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Pretendard: require('@/assets/fonts/PretendardVariable.ttf'),
  });

  // 폰트 로드 후 기본 폰트 적용 (마운트 후 1회만 실행)
  useEffect(() => {
    if (!loaded) return;

    const T: any = Text as any;
    const TI: any = TextInput as any;

    if (!T.defaultProps) T.defaultProps = {};
    if (!T.defaultProps.style) T.defaultProps.style = { fontFamily: 'Pretendard' };
    else T.defaultProps.style = [T.defaultProps.style, { fontFamily: 'Pretendard' }];

    if (!TI.defaultProps) TI.defaultProps = {};
    if (!TI.defaultProps.style) TI.defaultProps.style = { fontFamily: 'Pretendard' };
    else TI.defaultProps.style = [TI.defaultProps.style, { fontFamily: 'Pretendard' }];
  }, [loaded]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === 'light' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)/onboarding" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/register" />
          <Stack.Screen name="(main)/main" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="dark" backgroundColor="#ffffffff" />
      </ThemeProvider>
    </AppProvider>
  );
}
