import Header from '@/components/Header';
import SettingSection from '@/components/SettingSection';
import { useAppContext } from '@/contexts/AppContext';
import { authAPI } from '@/services/api';
import { useRouter } from 'expo-router';
import { Alert, Linking, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SETTINGS_LINKS = {
  PRIVACY_POLICY: 'https://url.dyhs.kr/smilefood_pp',
  REPORT: 'https://url.dyhs.kr/smilefood_report',
};

const THEME_COLOR = '#007AFF';

export default function SettingsScreen() {
  const router = useRouter();
  const { sessionId, clearNavigationStack } = useAppContext();

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃하시겠습니까?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          try {
            if (sessionId) {
              await authAPI.logout(sessionId);
            }
            clearNavigationStack();
            Alert.alert('로그아웃 완료', '로그아웃되었습니다.', [
              {
                text: '확인',
                onPress: () => router.replace('/login'),
              },
            ]);
          } catch (error: any) {
            console.error('Logout error:', error);
            const errorMessage =
              error.response?.data?.message || '로그아웃 중 오류가 발생했습니다.';
            Alert.alert('오류', errorMessage);
          }
        },
      },
    ]);
  };

  const menuItems = {
    profile: [
      { label: '프로필 편집', onPress: () => router.push('/profile-edit') }
    ],
    recipe: [
      { label: '레시피 추천 내역', onPress: () => router.push('/chat-list') }
    ],
    account: [
      { label: '비밀번호 변경', onPress: () => router.push('/change-password') },
      { label: '로그인 기록', onPress: () => router.push('/login-history') },
      { label: '로그아웃', onPress: handleLogout },
      { label: '회원탈퇴', onPress: () => router.push('/delete-account') },
    ],
    etc: [
      {
        label: '개인정보처리방침',
        onPress: () => Linking.openURL(SETTINGS_LINKS.PRIVACY_POLICY),
        icon: 'open-outline' as const,
      },
      {
        label: '문의/제보',
        onPress: () => Linking.openURL(SETTINGS_LINKS.REPORT),
        icon: 'open-outline' as const,
      },
    ],
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F4F6]">
      {/* Header */}
      <Header
        title="설정"
        showBack={true}
        showChat={false}
        showSettings={false}
      />

      {/* Settings Content */}
      <View className="flex-1 pt-5">
        <SettingSection title="프로필" items={menuItems.profile} />
        <SettingSection title="AI 레시피" items={menuItems.recipe} />
        <SettingSection title="계정" items={menuItems.account} />
        <SettingSection title="기타" items={menuItems.etc} />
      </View>
    </SafeAreaView>
  );
}
