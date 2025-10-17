import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { useAppContext } from '../contexts/AppContext';
import { authAPI } from '../services/api';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPrivacyPolicyAgreed, setIsPrivacyPolicyAgreed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { } = useAppContext();

  useEffect(() => {
    if (isTimerActive && timer > 0) {
      timerRef.current = setTimeout(() => {
        setTimer(timer - 1);
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

  const startTimer = () => {
    setTimer(60);
    setIsTimerActive(true);
  };

  const handleSendVerificationCode = async () => {
    if (!email) {
      setError('이메일을 입력해주세요.');
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
        Alert.alert('성공', response.message);
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
    <SafeAreaWrapper backgroundColor="#fff">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>회원가입</Text>
            <Text style={styles.subtitle}>새로운 계정을 만들어보세요</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>이메일</Text>
              <View style={styles.emailContainer}>
                <TextInput
                  style={[styles.input, styles.emailInput]}
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isEmailVerified}
                />
                <TouchableOpacity
                  style={[
                    styles.verifyButton, 
                    (isEmailVerified || isTimerActive || isLoading) && styles.disabledButton
                  ]}
                  onPress={handleSendVerificationCode}
                  disabled={isEmailVerified || isTimerActive || isLoading}
                >
                  <Text style={styles.verifyButtonText}>
                    {isEmailVerified 
                      ? '인증완료' 
                      : isTimerActive 
                        ? `재발송(${timer}s)` 
                        : '인증'
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {showVerificationInput && !isEmailVerified && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>인증 코드</Text>
                <View style={styles.verificationContainer}>
                  <TextInput
                    style={[styles.input, styles.verificationInput]}
                    placeholder="6자리 인증 코드를 입력하세요"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={styles.verifyCodeButton}
                    onPress={handleVerifyCode}
                    disabled={isLoading}
                  >
                    <Text style={styles.verifyCodeButtonText}>확인</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>비밀번호</Text>
              <TextInput
                style={styles.input}
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>이름</Text>
              <TextInput
                style={styles.input}
                placeholder="실명을 입력하세요"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.privacyContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setIsPrivacyPolicyAgreed(!isPrivacyPolicyAgreed)}
              >
                <View style={[styles.checkbox, isPrivacyPolicyAgreed && styles.checkedBox]}>
                  {isPrivacyPolicyAgreed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.privacyText}>
                  <Text style={styles.privacyTextNormal}>개인정보처리방침에 </Text>
                  <Text style={styles.privacyTextLink} onPress={handlePrivacyPolicyPress}>
                    동의
                  </Text>
                  <Text style={styles.privacyTextNormal}>합니다</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[
                styles.registerButton,
                (!isEmailVerified || !isPrivacyPolicyAgreed || isLoading) && styles.disabledButton,
              ]}
              onPress={handleRegister}
              disabled={!isEmailVerified || !isPrivacyPolicyAgreed || isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? '처리 중...' : '회원가입'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>로그인으로 돌아가기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#f9f9f9',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailInput: {
    flex: 1,
    marginRight: 12,
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  verifiedButton: {
    backgroundColor: '#34C759',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationInput: {
    flex: 1,
    marginRight: 12,
  },
  verifyCodeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  verifyCodeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  privacyContainer: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkedBox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  privacyTextNormal: {
    color: '#333',
  },
  privacyTextLink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});