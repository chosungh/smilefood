import Button from '@/components/Button';
import LabeledTextInput from '@/components/LabeledTextInput';
import { useAppContext } from '@/contexts/AppContext';
import { authAPI } from '@/services/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFindingPassword, setIsFindingPassword] = useState(false);
  const router = useRouter();
  const { setIsLoggedIn, setSessionId, setUserInfo } = useAppContext();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.login(email, password);

      if (response.code === 200) {
        // 세션 ID와 로그인 상태를 동시에 저장
        await setSessionId(response.data.sid);
        await setIsLoggedIn(true);

        // 로그인 성공 후 사용자 정보 가져오기
        try {
          const sessionResponse = await authAPI.getSessionInfo(response.data.sid);
          const userResponse = await authAPI.getUserInfo(sessionResponse.data.session_info.uid);
          await setUserInfo(userResponse.data.user_info);
          console.log('로그인 성공 및 데이터 저장 완료');
        } catch (error: any) {
          console.error('사용자 정보 가져오기 오류:', error);
        }

        router.replace('/main');
      } else {
        Alert.alert('로그인 실패', response.message || '로그인에 실패했습니다.');
      }
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindPassword = async () => {
    if (!email) {
      Alert.alert('오류', '이메일을 입력해주세요.');
      return;
    }

    setIsFindingPassword(true);
    try {
      const response = await authAPI.findPassword(email);
      Alert.alert('알림', response.message || '비밀번호 재설정 링크가 이메일로 전송되었습니다.');
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || '비밀번호 찾기 중 오류가 발생했습니다.');
    } finally {
      setIsFindingPassword(false);
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        className='flex-1'
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          className='flex-1'
          contentContainerClassName='flex-grow justify-center px-6 py-5'
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View className='items-center mb-12'>
            <Text className='text-3xl font-bold text-[#333] mb-2'>스마일푸드</Text>
            <Text className='text-base text-[#666]'>로그인하여 시작하세요</Text>
          </View>

          <LabeledTextInput
            label="이메일"
            placeholder="이메일을 입력하세요"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <LabeledTextInput
            label="비밀번호"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <Button
            title="로그인"
            onPress={handleLogin}
            isLoading={isLoading}
            disabled={isLoading}
            className="mt-6"
          />

          <View className='flex-row justify-between mt-6'>
            <TouchableOpacity onPress={handleFindPassword} disabled={isFindingPassword}>
              <Text className={`text-base ${isFindingPassword ? 'text-[#999]' : 'text-[#007AFF]'}`}>
                {isFindingPassword ? '처리 중...' : '비밀번호 찾기'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text className='text-base text-[#007AFF]'>회원가입</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
