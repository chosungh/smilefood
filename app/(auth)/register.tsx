import Button from '@/components/Button';
import { authAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const router = useRouter();

  // Inputs Refs
  const emailInputRef = useRef<TextInput>(null);
  const verificationInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Verification State
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPrivacyPolicyAgreed, setIsPrivacyPolicyAgreed] = useState(false);

  useEffect(() => {
    if (isTimerActive && timer > 0) {
      timerRef.current = setTimeout(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && isTimerActive) {
      setIsTimerActive(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timer, isTimerActive]);

  // Focus verification input when it shows up
  useEffect(() => {
    if (showVerificationInput && !isEmailVerified) {
      // Small timeout to ensure the view is rendered
      setTimeout(() => {
        verificationInputRef.current?.focus();
      }, 100);
    }
  }, [showVerificationInput, isEmailVerified]);

  const startTimer = () => {
    setTimer(60);
    setIsTimerActive(true);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (isEmailVerified || showVerificationInput) {
      setIsEmailVerified(false);
      setShowVerificationInput(false);
      setIsTimerActive(false);
      setTimer(0);
      setVerificationCode('');
    }
  };

  const handleSendVerificationCode = async () => {
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    if (!validateEmail(email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.sendEmailVerificationCode(email);

      if (response.code === 200) {
        setShowVerificationInput(true);
        startTimer();
        Alert.alert('성공', response.message);
      } else {
        setError(response.message || '인증 코드 전송에 실패했습니다.');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || '인증 코드 전송 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('인증 코드를 입력해주세요.');
      Alert.alert('오류', '인증 코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyEmailCode(email, verificationCode);

      if (response.code === 200) {
        setIsEmailVerified(true);
        setShowVerificationInput(false); // Hide input on success to clean up UI
        Alert.alert('성공', response.message);
        // Automatically focus password input after verification
        setTimeout(() => passwordInputRef.current?.focus(), 100);
      } else {
        const errorMessage = response.message || '인증 코드가 일치하지 않습니다.';
        setError(errorMessage);
        Alert.alert('인증 실패', errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '인증 코드 확인 중 오류가 발생했습니다.';
      setError(errorMessage);
      Alert.alert('오류', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacyPolicyPress = () => {
    Linking.openURL('https://url.dyhs.kr/smilefood_pp');
  };

  const handleRegister = async () => {
    if (!email || !password || !name) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (!isEmailVerified) {
      setError('이메일 인증을 완료해주세요.');
      return;
    }

    if (!isPrivacyPolicyAgreed) {
      setError('개인정보처리방침에 동의해주세요.');
      Alert.alert('동의 필요', '개인정보처리방침에 동의해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.register(email, password, name);

      if (response.code === 200) {
        Alert.alert('회원가입 완료', response.message, [
          {
            text: '확인',
            onPress: () => router.replace('/login'),
          },
        ]);
      } else {
        setError(response.message || '회원가입에 실패했습니다.');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
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
          contentContainerClassName='flex-grow px-6 pt-10 pb-5'
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View className='items-center mb-8'>
            <Text className='text-3xl font-bold text-[#333] mb-2'>회원가입</Text>
            <Text className='text-base text-[#666]'>새로운 계정을 만들어보세요</Text>
          </View>

          <View className='w-full'>
            <View className='mb-5'>
              <Text className='text-base font-semibold text-[#333] mb-2'>이메일</Text>
              <View className='flex-row items-center'>
                <TextInput
                  ref={emailInputRef}
                  className={`flex-1 mr-3 border rounded-xl px-4 py-3 text-base text-black bg-[#f9f9f9] ${isEmailVerified ? 'border-[#007AFF] bg-[#f0f9ff]' : 'border-[#ddd]'}`}
                  placeholder="예시) me@example.com"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    if (isEmailVerified) {
                      passwordInputRef.current?.focus();
                    }
                  }}
                  blurOnSubmit={false}
                />
                <Button
                  title={isEmailVerified
                    ? '인증완료'
                    : isTimerActive
                      ? `재발송(${timer}s)`
                      : '인증'}
                  onPress={handleSendVerificationCode}
                  disabled={isEmailVerified || isTimerActive || isLoading}
                  className={`rounded-lg ${isEmailVerified ? 'bg-[#4cd964]' : ''}`}
                  textClassName="text-sm"
                />
              </View>
            </View>

            {showVerificationInput && !isEmailVerified && (
              <View className='mb-5'>
                <Text className='text-base font-semibold text-[#333] mb-2'>인증 코드</Text>
                <View className='flex-row items-center'>
                  <TextInput
                    ref={verificationInputRef}
                    className='flex-1 mr-3 border border-[#ddd] rounded-xl px-4 py-3 text-base text-black bg-[#f9f9f9]'
                    placeholder="6자리 인증 코드를 입력하세요"
                    placeholderTextColor="#999"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    returnKeyType="done"
                    autoCapitalize="none"
                    onSubmitEditing={handleVerifyCode}
                  />
                  <Button
                    title="확인"
                    onPress={handleVerifyCode}
                    disabled={isLoading}
                    className="rounded-lg"
                    textClassName="text-sm"
                  />
                </View>
              </View>
            )}

            <View className='mb-5'>
              <Text className='text-base font-semibold text-[#333] mb-2'>비밀번호</Text>
              <TextInput
                ref={passwordInputRef}
                className='border border-[#ddd] rounded-xl px-4 py-3 text-base text-black bg-[#f9f9f9]'
                placeholder="비밀번호를 입력해주세요."
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => nameInputRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            <View className='mb-5'>
              <Text className='text-base font-semibold text-[#333] mb-2'>이름</Text>
              <TextInput
                ref={nameInputRef}
                className='border border-[#ddd] rounded-xl px-4 py-3 text-base text-black bg-[#f9f9f9]'
                placeholder="이름을 입력해주세요."
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
            </View>

            <View className='mb-5'>
              <TouchableOpacity
                className='flex-row items-center'
                onPress={() => setIsPrivacyPolicyAgreed(!isPrivacyPolicyAgreed)}
              >
                <View className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${isPrivacyPolicyAgreed ? 'bg-[#007AFF] border-[#007AFF]' : 'bg-white border-[#ddd]'}`}>
                  {isPrivacyPolicyAgreed && <Ionicons name="checkmark-sharp" size={16} color="#fff" />}
                </View>
                <Text className='flex-1 text-sm leading-5'>
                  <Text className='text-[#333]'>개인정보처리방침에 </Text>
                  <Text className='text-[#007AFF] underline' onPress={handlePrivacyPolicyPress}>
                    동의
                  </Text>
                  <Text className='text-[#333]'>합니다</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {error ? <Text className='text-[#ff3b30] text-sm mb-4 text-center'>{error}</Text> : null}

            <Button
              title={isLoading ? '처리 중...' : '회원가입'}
              onPress={handleRegister}
              disabled={!isEmailVerified || !isPrivacyPolicyAgreed || isLoading}
              className="mt-6 py-2"
            />

            <TouchableOpacity
              className='items-center mt-4'
              onPress={() => router.back()}
            >
              <Text className='text-[#007AFF] text-base'>로그인으로 돌아가기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}