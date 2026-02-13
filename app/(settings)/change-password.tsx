import Button from '@/components/Button';
import Header from '@/components/Header';
import LabeledTextInput from '@/components/LabeledTextInput';
import { useAppContext } from '@/contexts/AppContext';
import { authAPI } from '@/services/api';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { sessionId } = useAppContext();

  // Refs
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  // Form State
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !submitting && password.length > 0 && newPassword.length > 0 && confirmPassword.length > 0;

  const handleSubmit = async () => {
    if (!sessionId) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('오류', '새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    try {
      setSubmitting(true);
      await authAPI.updateProfile(sessionId, { password, new_password: newPassword });
      Alert.alert('완료', '비밀번호가 변경되었습니다.', [
        { text: '확인', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-[#F2F4F6]'>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Header
        title="비밀번호 변경"
        showBack={true}
        showChat={false}
        showSettings={false}
      />

      <KeyboardAvoidingView
        className='flex-1'
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerClassName='flex-grow p-5'
          keyboardShouldPersistTaps="handled"
        >
          <View className='bg-white rounded-xl p-5'>
            <LabeledTextInput
              label="현재 비밀번호"
              placeholder="현재 비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => newPasswordRef.current?.focus()}
              blurOnSubmit={false}
            />

            <LabeledTextInput
              ref={newPasswordRef}
              label="새 비밀번호"
              placeholder="새 비밀번호"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              blurOnSubmit={false}
            />

            <LabeledTextInput
              ref={confirmPasswordRef}
              label="새 비밀번호 확인"
              placeholder="새 비밀번호 확인"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <Button
              title="변경하기"
              onPress={handleSubmit}
              disabled={!canSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
