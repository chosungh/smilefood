import { authAPI } from '@/services/api';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Modal,
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
import { Ionicons } from '@expo/vector-icons';

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
  const [foodInfoModalVisible, setFoodInfoModalVisible] = useState(false);
  const router = useRouter();
  const { setIsLoggedIn, setSessionId, sessionId, userInfo, setUserInfo } = useAppContext();
  const [foodList, setFoodList] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  useEffect(() => {
  console.log(sessionId)
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

  // 식품 리스트 조회
  const showFoodList = async () => {
    try {
      if (sessionId) {
        const response = await authAPI.getFoodListInfo(sessionId); 
        
        if (response.code === 200) {
          const foodList = response.data.food_list;
          setFoodList(foodList);
        }
      }

      
    } catch (error) {
      console.error('Error fetching food list:', error);
      Alert.alert('오류', '식품 목록을 불러오는 중 오류가 발생했습니다.');
    }
  }

  // 식품 삭제
  const DeleteFood = async (fid: string) => {
    try {
      if (sessionId && fid) {
        const response = await authAPI.deleteFood(sessionId, fid);
        if (response.code === 200) {
          Alert.alert('식품이 삭제되었습니다.');
          showFoodList(); // 삭제 후 리스트 갱신
          setFoodInfoModalVisible(false)
        } else {
          Alert.alert('오류', '식품 삭제에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('Error deleting food:', error);
      Alert.alert('오류', '식품 삭제 중 오류가 발생했습니다.');
    }
  };

  // 식품 정보 조회
  const FoodInfo = async (item: FoodItem) => {
    try {
      if (item.fid && sessionId) {
        const response = await authAPI.getFoodListInfo(sessionId);

        const food = response.data.food_list.find((food: FoodItem) => food.fid === item.fid);
        setSelectedFood(food);
        if (response.code === 200) {
          // const foodInfo = response.data.food_info;
          // console.log(foodInfo);
          
        } else {
          Alert.alert('오류', '식품 정보를 불러오지 못했습니다.');
        }
      }
    } catch (error) {
      console.error('Error fetching food info:', error);
      Alert.alert('오류', '식품 정보를 불러오지 못했습니다.');
    }
  }

  // 식품 리스트 뷰 생성
  const FoodCard = ({ item }: { item: FoodItem }) => {
    
    return (
      <TouchableOpacity 
        style={styles.FoodListView}
        onPress={() => { FoodInfo(item);  setFoodInfoModalVisible(true); }}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.image_url }} style={styles.FoodListViewImg} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={styles.FoodListViewTitle}>{item.name}</Text>
          <Text style={styles.FoodListViewContent}>수량: {item.count}</Text>
        </View>
      </TouchableOpacity>
    );
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

      {/* 식품 리스트 뷰 */}
      <View style={styles.MainFoodListView}>
        <ScrollView>
          {foodList.map((item) => (
            <FoodCard key={item.fid} item={item} />
          ))}
        </ScrollView>
      </View>

      <MenuButtonAndModal />
      
      {/* 식품 세부정보 확인 모달 */}
      <Modal
        visible={foodInfoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFoodInfoModalVisible(false)}
      >
        <View style={styles.ModalBackgroundShade}>
          <View style={styles.ModalBackground}>
            <View style={styles.ModalArrowBack}>
              <TouchableOpacity onPress={() => setFoodInfoModalVisible(false)} style={{ marginBottom: 20 }}>
                <Ionicons name='arrow-back' size={24} />
              </TouchableOpacity>
            </View>
            {selectedFood ? (
              <ScrollView style={{padding: 20, flex: 1}}>
                <View style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'flex-start', gap: 20 }}>
                  <View>
                    <Image source={{ uri: selectedFood.image_url }} style={styles.FoodInfoModalImage} />
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{selectedFood.name}</Text>
          
                  <View style={styles.DefalutView}>
                    <View style={styles.FoodInfoModalInfo}>
                      <Text style={styles.FoodInfoModalInfoTitle}>유형</Text>
                      <Text style={styles.FoodInfoModalText}>{selectedFood.type}</Text>
                    </View>
                    <View style={styles.FoodInfoModalInfo}>
                      <Text style={styles.FoodInfoModalInfoTitle}>수량</Text>
                      <Text style={styles.FoodInfoModalText}>{selectedFood.count}</Text>
                    </View>
                    <View style={styles.FoodInfoModalInfo}>
                      <Text style={styles.FoodInfoModalInfoTitle}>유통기한</Text>
                      <Text style={styles.FoodInfoModalText}>{selectedFood.expiration_date_desc}</Text>
                    </View>
                    <View style={styles.FoodInfoModalInfo}>
                      <Text style={styles.FoodInfoModalInfoTitle}>유통기한 만료 날짜</Text>
                      <Text style={styles.FoodInfoModalText}>{selectedFood.expiration_date}</Text>
                    </View>
                    <View style={styles.FoodInfoModalInfo}>
                      <Text style={styles.FoodInfoModalInfoTitle}>중량</Text>
                      <Text style={styles.FoodInfoModalText}>{selectedFood.volume}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.FoodInfoDeleteButton} onPress={() => DeleteFood(selectedFood.fid)}>
                    <Text style={{ color: '#ff0000', fontSize: 16, fontWeight: 'bold' }}>삭제</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
        
            ) : (
              <Text>불러오는 중...</Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  DefalutView: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  FoodListView: {
    height: Dimensions.get('window').height / 10,
    width: '100%',
    flexDirection: 'row',
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  FoodListViewImg: {
    width: (Dimensions.get('window').height / 10)-20,
    aspectRatio: 1,
    borderRadius: 6,
    marginRight: 12,
  },
  FoodListViewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  FoodListViewContent: {
    fontSize: 14,
    color: '#666',
  },
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
  MainFoodListView: {
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
  },
  ModalBackgroundShade: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingTop: 100,
    paddingBottom: 80,
    paddingLeft: 40,
    paddingRight: 40
  },
  ModalBackground: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    borderRadius: 16,
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
  },
  ModalArrowBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    padding: 20,
    zIndex: 20,
    borderRadius: 16
  },
  FoodInfoModalImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  FoodInfoModalInfo: {
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f4',
    paddingLeft: 20,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
  },
  FoodInfoModalInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  FoodInfoModalText: {
    fontSize: 12,
    color: '#666'
  },
  FoodInfoDeleteButton: {
    backgroundColor: '#fff',
    width: '100%',
    marginBottom: 20,
    borderRadius: 12,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  }
});