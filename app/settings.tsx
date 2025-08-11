import { authAPI } from '@/services/api';
import { useRouter } from 'expo-router';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { useAppContext } from '../contexts/AppContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { setIsLoggedIn, setSessionId, sessionId, setUserInfo, clearNavigationStack } = useAppContext();

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '로그아웃하시겠습니까?',
      [
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
                const response = await authAPI.logout(sessionId);
                Alert.alert('로그아웃 성공', response.message);
              }
              
              // AppContext의 clearNavigationStack 함수 사용
              clearNavigationStack();
              
              // 네비게이션 스택을 완전히 정리하고 로그인 화면으로 이동
              router.replace('/login');
              
              // 추가로 네비게이션 스택을 정리
              setTimeout(() => {
                router.replace('/login');
              }, 100);
            } catch (error: any) {
              console.error('Logout error:', error);
              Alert.alert('오류', error.response?.data?.message || '로그아웃 중 오류가 발생했습니다.');
            }
          },
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
    Alert.alert('프로필 편집', '편집 기능은 준비 중입니다.');
  };

  const handleRecipeLog = () => {
    Alert.alert('레시피 이용 내역', '이용 내역 기능은 준비 중입니다.');
  }
  

  return (
    <SafeAreaWrapper style={styles.container} backgroundColor="#f8f9fa">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Settings Content */}
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>프로필</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleProfileEdit}>
            <Text style={styles.menuItemText}>프로필 편집</Text>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>레시피</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleRecipeLog}>
            <Text style={styles.menuItemText}>이용 내역</Text>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleLoginHistory}>
            <Text style={styles.menuItemText}>로그인 기록</Text>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={styles.menuItemText}>로그아웃</Text>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleAccountDeletion}>
            <Text style={styles.menuItemText}>회원탈퇴</Text>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  menuItemArrow: {
    fontSize: 16,
    color: '#ccc',
  },
});
