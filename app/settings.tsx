import { authAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
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
  

  return (
    <SafeAreaWrapper backgroundColor="#f8f9fa">
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
          
          <TouchableOpacity style={styles.menuItem} onPress={handleProfileEdit}>
            <Text style={styles.menuItemText}>프로필 편집</Text>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>레시피</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleRecipeLog}>
            <Text style={styles.menuItemText}>레시피 추천 내역</Text>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
            <Text style={styles.menuItemText}>비밀번호 변경</Text>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>

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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
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