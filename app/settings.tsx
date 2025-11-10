import { authAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../contexts/AppContext';
import { SettingsStyles as styles } from '../styles/GlobalStyles';


export default function SettingsScreen() {
  const router = useRouter();
  const { sessionId, clearNavigationStack } = useAppContext();

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '로그아웃하시겠습니까?',
      [

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
                  onPress: () => {
                    router.replace('/login');
                    setTimeout(() => {
                      router.replace('/login');
                    }, 100);
                  },
                },
              ]);
            } catch (error: any) {
              console.error('Logout error:', error);
              const errorMessage = error.response?.data?.message || '로그아웃 중 오류가 발생했습니다.';
              Alert.alert('오류', errorMessage);
            }
          },
        },
        {
          text: '취소',
          style: 'cancel',
        },
      ]
    );
  };

  const handleAccountDeletion = () => {
    router.push('/delete-account');
  };

  const handleLoginHistory = () => {
    router.push('/login-history');
  };

  const handleProfileEdit = () => {
    router.push('/profile-edit');
  };

  const handleChangePassword = () => {
    router.push('/change-password');
  };

  const handleRecipeLog = () => {
    router.push('/chat-list');
  }

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://url.dyhs.kr/smilefood_pp');
  };

  const handleReport = () => {
    Linking.openURL('https://url.dyhs.kr/smilefood_report');
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Settings Content */}
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>프로필</Text>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemFirst, styles.menuItemLast]} onPress={handleProfileEdit}>
            <Text style={styles.menuItemText}>프로필 편집</Text>
            <Ionicons name="arrow-forward-outline" size={18} style={styles.menuItemArrow} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 레시피</Text>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemFirst, styles.menuItemLast]} onPress={handleRecipeLog}>
            <Text style={styles.menuItemText}>레시피 추천 내역</Text>
            <Ionicons name="arrow-forward-outline" size={18} style={styles.menuItemArrow} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemFirst]} onPress={handleChangePassword}>
            <Text style={styles.menuItemText}>비밀번호 변경</Text>
            <Ionicons name="arrow-forward-outline" size={18} style={styles.menuItemArrow} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLoginHistory}>
            <Text style={styles.menuItemText}>로그인 기록</Text>
            <Ionicons name="arrow-forward-outline" size={18} style={styles.menuItemArrow} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={styles.menuItemText}>로그아웃</Text>
            <Ionicons name="arrow-forward-outline" size={18} style={styles.menuItemArrow} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleAccountDeletion}>
            <Text style={styles.menuItemText}>회원탈퇴</Text>
            <Ionicons name="arrow-forward-outline" size={18} style={styles.menuItemArrow} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기타</Text>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemFirst]} onPress={handlePrivacyPolicy}>
            <Text style={styles.menuItemText}>개인정보처리방침</Text>
            <Ionicons name="open-outline" size={18} style={styles.menuItemArrow} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleReport}>
            <Text style={styles.menuItemText}>문의/제보</Text>
            <Ionicons name="open-outline" size={18} style={styles.menuItemArrow} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
