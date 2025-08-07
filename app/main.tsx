import { authAPI } from '@/services/api';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';

export default function MainScreen() {
  const router = useRouter();
  const { setIsLoggedIn, setSessionId, sessionId, userInfo, setUserInfo } = useAppContext();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        if (sessionId) {
          const sessionResponse = await authAPI.getSessionInfo(sessionId);
          
          // 세션 만료 확인
          if (sessionResponse.data.session_info.is_active === 0) {
            Alert.alert('세션 만료', '세션이 만료되었습니다. 다시 로그인하세요.');
            setSessionId(null);
            setUserInfo(null);
            setIsLoggedIn(false);
            router.replace('/login');
            return;
          }
          
          const userResponse = await authAPI.getUserInfo(sessionResponse.data.session_info.uid);
          const userInfoData = userResponse.data.user_info;
          setUserInfo(userInfoData);
        }
      } catch (error: any) {
        console.error('User info fetch error:', error?.response);
      }
    };

    fetchUserInfo();

    // 5초마다 갱신
    const interval = setInterval(fetchUserInfo, 5000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
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
              
              setSessionId(null);
              setUserInfo(null);
              setIsLoggedIn(false);
              router.replace('/login');
            } catch (error: any) {
              console.error('Logout error:', error);
              Alert.alert('오류', error.response?.data?.message || '로그아웃 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleCamera = () => {
    // 카메라 기능 구현 예정
    Alert.alert('카메라', '카메라 기능이 곧 구현됩니다.');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SmileFood</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={handleLogout}>
          <Text style={styles.settingsButtonText}>설정</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            {userInfo?.profile_url ? (
              <Image 
                source={{ uri: userInfo.profile_url }} 
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {userInfo?.name?.charAt(0) || 'A'}
              </Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userInfo?.name || 'username'}</Text>
            <Text style={styles.userEmail}>{userInfo?.email || 'user@example.com'}</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          안녕하세요, {userInfo?.name || '사용자'}님!{'\n'}
          오늘도 건강한 식습관을 유지해보세요.
        </Text>
        
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCamera}>
            <Text style={styles.actionButtonIcon}>📸</Text>
            <Text style={styles.actionButtonText}>음식 촬영</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>📊</Text>
            <Text style={styles.actionButtonText}>영양 분석</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>📝</Text>
            <Text style={styles.actionButtonText}>식단 기록</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cameraButton} onPress={handleCamera}>
          <Text style={styles.cameraButtonIcon}>📷</Text>
          <Text style={styles.cameraButtonText}>카메라로 이동</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  settingsButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 26,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
    elevation: 3,
    minWidth: 80,
  },
  actionButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  cameraButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  cameraButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});