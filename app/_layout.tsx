import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput, View } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import '../utils/globalErrorHandler';
import { AppProvider } from '../contexts/AppContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Pretendard: require('../assets/fonts/PretendardVariable.ttf'),
  });

  if (loaded) {
    const T: any = Text as any;
    const TI: any = TextInput as any;

    if (!T.defaultProps) T.defaultProps = {};
    if (!T.defaultProps.style) T.defaultProps.style = { fontFamily: 'Pretendard' };
    else T.defaultProps.style = [T.defaultProps.style, { fontFamily: 'Pretendard' }];

    if (!TI.defaultProps) TI.defaultProps = {};
    if (!TI.defaultProps.style) TI.defaultProps.style = { fontFamily: 'Pretendard' };
    else TI.defaultProps.style = [TI.defaultProps.style, { fontFamily: 'Pretendard' }];
  }

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
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="main" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="dark" backgroundColor="#ffffff" />
      </ThemeProvider>
    </AppProvider>
  );
}
