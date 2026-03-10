import Button from '@/components/Button';
import Header from '@/components/Header';
import LabeledTextInput from '@/components/LabeledTextInput';
import { useAppContext } from '@/contexts/AppContext';
import { authAPI } from '@/services/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { userInfo, clearNavigationStack } = useAppContext();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (!password.trim()) {
      Alert.alert('오류', '비밀번호를 입력해주세요.');
      return;
    }

    if (!userInfo?.email) {
      Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
      return;
    }

    Alert.alert(
      '회원탈퇴',
      '회원을 탈퇴하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
      [
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const response = await authAPI.deleteAccount(userInfo.email, password);

              // 성공 시 로그아웃 처리
              clearNavigationStack();

              Alert.alert(
                '탈퇴 완료',
                response.message,
                [
                  {
                    text: '확인',
                    onPress: () => {
                      router.replace('/login');
                    },
                  },
                ]
              );
            } catch (error: any) {
              if (error.response?.data?.message) {
                Alert.alert('오류', error.response.data.message);
              } else {
                Alert.alert('오류', '회원탈퇴 중 오류가 발생했습니다.');
              }
            } finally {
              setIsLoading(false);
            }
          },
        },
        {
          text: '취소',
          style: 'cancel',
        }
      ]
    );
  };

  return (
    <SafeAreaView className='flex-1 bg-[#F2F4F6]'>
      {/* Header */}
      <Header
        title="회원탈퇴"
        showBack={true}
        showChat={false}
        showSettings={false}
      />

      {/* Content */}
      <View className='flex-1 p-5'>
        <View className='bg-white rounded-xl p-5'>
          {/* 비밀번호 입력 */}
          <LabeledTextInput
            label="비밀번호 확인"
            placeholder="현재 비밀번호를 입력하세요"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
            containerClassName="mb-7"
          />

          {/* 경고 메시지 */}
          <View className='bg-[#fff3cd] border border-[#ffeaa7] rounded-xl p-5 mb-7'>
            <Text className='text-sm text-[#856404] leading-5'>
              회원탈퇴를 진행하면 모든 데이터가 영구적으로 삭제되며, 복구할 수 없습니다.
            </Text>
          </View>

          {/* 버튼 영역 */}
          <View className='flex-row gap-4'>
            <Button
              title="취소"
              onPress={() => router.back()}
              disabled={isLoading}
              className='flex-1 bg-[#6c757d]'
            />
            <Button
              title={isLoading ? '처리중...' : '탈퇴하기'}
              onPress={handleDeleteAccount}
              isLoading={isLoading}
              className='flex-1 bg-[#dc3545]'
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}