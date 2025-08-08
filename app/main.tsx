import { authAPI } from '@/services/api';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import MenuButtonAndModal from './menuButtonAndModal';

type FoodItem = {
  barcode: string;
  count: number;
  created_at: string;
  description: string;
  expiration_date: string;
  expiration_date_desc: string;
  fid: string;
  image_url: string;
  name: string;
  type: string;
  uid: string;
  volume: string;
};

export default function MainScreen() {
  const router = useRouter();
  const { setIsLoggedIn, setSessionId, sessionId, userInfo, setUserInfo } = useAppContext();
  const [ foodList, setFoodList ] = useState<FoodItem[]>([]);

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

        // 여기서 food list도 같이 가져오기
        showFoodList();
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

  const showFoodList = async () => {
    try {
      if (sessionId) {
        const response = await authAPI.getFoodListInfo(sessionId); 
        
        if (response.code === 200) {
          const foodList = response.data.food_list;
          setFoodList(foodList);
        }
      }

      
    } catch (error) { }
  }
  
  const FoodCard = ({ item }: { item: FoodItem }) => {
    const cardHeight = Dimensions.get('window').height / 10;
    
    return (
      <TouchableOpacity style={{
        height: cardHeight,
        width: '100%',
        flexDirection: 'row',
      }}>
        <Image source={{ uri: item.image_url }} style={{
          height: cardHeight-20,
          width: cardHeight-20,
        }} />
        <View>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#333',
            marginBottom: 4,
          }}>{item.name}</Text>
          <Text style={{
            fontSize: 14,
            color: '#666',
          }}>수량: {item.count}</Text>
        </View>
      </TouchableOpacity>
    );
  };


  const handleCamera = () => {
    // 카메라 기능 구현 예정
    Alert.alert('카메라', '카메라 기능이 곧 구현됩니다.');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SmileFood</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
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
      <View style={{
        backgroundColor: '#fff',
        height: Dimensions.get('window').height/2,
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
      }}>
        <ScrollView>
          {foodList.map((item) => (
            <FoodCard key={item.fid} item={item} />
          ))}
        </ScrollView>
      </View>

      {/* Footer */}
      {/* <View style={styles.footer}>
        <TouchableOpacity style={styles.cameraButton} onPress={handleCamera}>
          <Text style={styles.cameraButtonIcon}>📷</Text>
          <Text style={styles.cameraButtonText}>카메라로 이동</Text>
        </TouchableOpacity>
      </View> */}
      <MenuButtonAndModal />
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