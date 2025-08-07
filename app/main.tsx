import { authAPI, foodAPI, FoodItem } from '@/services/api';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { FoodItemComponent } from '../components/FoodItem';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { useAppContext } from '../contexts/AppContext';

export default function MainScreen() {
  const router = useRouter();
  const { setIsLoggedIn, setSessionId, sessionId, userInfo, setUserInfo } = useAppContext();
  const [foodList, setFoodList] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      router.replace('/login');
      return;
    }

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

      const fetchFoodList = async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      const response = await foodAPI.getFoodList(sessionId);
      if (response.code === 200) {
        setFoodList(response.data.food_list);
      }
    } catch (error: any) {
      console.error('Food list fetch error:', error?.response);
      Alert.alert('오류', '음식 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodListSilent = async () => {
    if (!sessionId) return;
    
    try {
      const response = await foodAPI.getFoodList(sessionId);
      if (response.code === 200) {
        setFoodList(response.data.food_list);
      }
    } catch (error: any) {
      console.error('Food list silent fetch error:', error?.response);
      // 조용히 에러 처리 (알림 없음)
    }
  };

    fetchUserInfo();
    fetchFoodList();

    // 5초마다 세션, 유저 정보, 음식 정보 갱신
    const interval = setInterval(() => {
      fetchUserInfo();
      fetchFoodListSilent(); // 로딩 없이 조용히 업데이트
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const onRefresh = async () => {
    if (!sessionId) return;
    
    setRefreshing(true);
    try {
      const response = await foodAPI.getFoodList(sessionId);
      if (response.code === 200) {
        setFoodList(response.data.food_list);
      }
    } catch (error: any) {
      console.error('Food list refresh error:', error?.response);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFoodItemPress = (food: FoodItem) => {
    // 음식 아이템 상세 정보 표시 (나중에 구현)
    Alert.alert(food.name, `${food.description}\n\n유통기한: ${food.expiration_date_desc}`);
  };

  const handleCamera = () => {
    router.push('/camera');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <SafeAreaWrapper style={styles.container} backgroundColor="#f8f9fa">
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

      {/* Food List */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>내 음식 목록</Text>
          <Text style={styles.foodCount}>{foodList.length}개</Text>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>음식 목록을 불러오는 중...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.foodList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {foodList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🍽️</Text>
                <Text style={styles.emptyTitle}>음식이 없습니다</Text>
                <Text style={styles.emptyDescription}>
                  카메라로 음식을 추가해보세요!
                </Text>
              </View>
            ) : (
              foodList.map((food) => (
                <FoodItemComponent
                  key={food.fid}
                  food={food}
                  onPress={() => handleFoodItemPress(food)}
                />
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Floating Action Button */}
      <FloatingActionButton onCameraPress={handleCamera} />
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  foodCount: {
    fontSize: 16,
    color: '#666',
  },
  foodList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

});