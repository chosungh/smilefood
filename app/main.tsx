import { authAPI, foodAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import { preloadImages } from '../utils/imageCache';
import MenuButtonAndModal from './menuButtonAndModal';
import { getStatusBarHeight } from 'react-native-status-bar-height';

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

const statusbarHeight = getStatusBarHeight();

export default function MainScreen() {
  const [foodInfoModalVisible, setFoodInfoModalVisible] = useState(false);
  const router = useRouter();
  const { setIsLoggedIn, setSessionId, sessionId, userInfo, setUserInfo, setRefreshFoodList } = useAppContext();
  const [foodList, setFoodList] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const initialLoadDone = useRef(false);
  


  // 식품 리스트를 메모이제이션하여 불필요한 리렌더링 방지
  const memoizedFoodList = useMemo(() => foodList, [foodList]);
  
  // FoodCard 컴포넌트를 메모이제이션하여 불필요한 리렌더링 방지
  const renderFoodCard = useCallback(({ item, isLast }: { item: FoodItem, isLast?: boolean }) => {
    return <FoodCard key={item.fid} item={item} isLast={isLast} />;
  }, []);

  // 초기 로드 - sessionId가 변경될 때만 실행
  useEffect(() => {
    if (sessionId && !initialLoadDone.current) {
      const loadInitialData = async () => {
        try {
          // 유저 정보 가져오기
          const sessionResponse = await authAPI.getSessionInfo(sessionId);
          
          if (sessionResponse.data.session_info.is_active === 0) {
            Alert.alert('세션 만료', '세션이 만료되었습니다. 다시 로그인하세요.');
            setSessionId(null);
            setUserInfo(null);
            setIsLoggedIn(false);
            router.replace('/login');
            return;
          }
          
          const userResponse = await authAPI.getUserInfo(sessionResponse.data.session_info.uid);
          setUserInfo(userResponse.data.user_info);

          // 식품 리스트 가져오기 (초기 로드 시에만)
          try {
            const foodResponse = await foodAPI.getFoodList(sessionId);
            if (foodResponse.code === 200) {
              setFoodList(foodResponse.data.food_list);
            // 이미지 프리로딩
            const imageUrls = foodResponse.data.food_list
              .map(food => food.image_url)
              .filter(url => url && url.trim() !== '');
              preloadImages(imageUrls);
            }
          } catch (error: any) {
            Alert.alert('오류', error.response?.data?.message || '식품 목록을 불러오는 중 오류가 발생했습니다.');
          }
          
          initialLoadDone.current = true;
        } catch (error: any) {
          console.error('Initial load error:', error?.response);
        }
      };

      loadInitialData();
    }
  }, [sessionId]); // sessionId가 변경될 때만 실행

  // 5초마다 유저 정보만 갱신 - 식품 리스트는 절대 건드리지 않음
  useEffect(() => {
    if (!sessionId || !initialLoadDone.current) return;

    const interval = setInterval(async () => {
      try {
        const sessionResponse = await authAPI.getSessionInfo(sessionId);
        
        if (sessionResponse.data.session_info.is_active === 0) {
          Alert.alert('세션 만료', '세션이 만료되었습니다. 다시 로그인하세요.');
          setSessionId(null);
          setUserInfo(null);
          setIsLoggedIn(false);
          router.replace('/login');
          return;
        }
        
        const userResponse = await authAPI.getUserInfo(sessionResponse.data.session_info.uid);
        setUserInfo(userResponse.data.user_info);
        // 식품 리스트는 절대 건드리지 않음 - 깜빡임 방지
      } catch (error: any) {
        console.error('User info fetch error:', error?.response);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId]); // sessionId가 변경될 때만 실행

  // pull-to-refresh 핸들러 - 식품 리스트만 갱신
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (sessionId) {
        const response = await foodAPI.getFoodList(sessionId);
        if (response.code === 200) {
          setFoodList(response.data.food_list);
          // 이미지 프리로딩
          const imageUrls = response.data.food_list
            .map(food => food.image_url)
            .filter(url => url && url.trim() !== '');
          preloadImages(imageUrls);
        }
      }
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || '식품 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setRefreshing(false);
    }
  }, [sessionId]);

  // onRefresh 함수를 AppContext에 등록
  useEffect(() => {
    setRefreshFoodList(() => onRefresh);
    return () => setRefreshFoodList(null);
  }, [onRefresh, setRefreshFoodList]);

  // 식품 삭제
  const DeleteFood = async (fid: string) => {
    Alert.alert(
      '식품 삭제',
      '식품을 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              if (sessionId && fid) {
                const response = await foodAPI.deleteFood(sessionId, fid);
                if (response.code === 200) {
                  Alert.alert('삭제 완료', response.message);
                  onRefresh(); // 삭제 후 리스트 갱신
                  setFoodInfoModalVisible(false);
                } else {
                  Alert.alert('오류', '식품 삭제에 실패했습니다.');
                }
              }
            } catch (error) {
              console.error('Error deleting food:', error);
              Alert.alert('오류', '식품 삭제 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  // 식품 정보 조회
  const FoodInfo = async (item: FoodItem) => {
    try {
      if (item.fid && sessionId) {
        const response = await foodAPI.getFoodInfo(sessionId, item.fid);
        
        if (response.code === 200) {
          const foodInfo = response.data.food_info;
          setSelectedFood(foodInfo);
        } else {
          Alert.alert('오류', '식품 정보를 불러오지 못했습니다.');
        }
      }
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || '식품 정보를 불러오지 못했습니다.');
    }
  }

  // 식품 리스트 뷰 생성
  const FoodCard = React.memo(({ item, isLast }: { item: FoodItem, isLast?: boolean }) => {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    
    const handleImageLoad = () => {
      setImageLoading(false);
      setImageError(false);
    };

    const handleImageError = () => {
      setImageLoading(false);
      setImageError(true);
    };
    
    return (
      <TouchableOpacity 
        style={[styles.FoodListView, isLast && styles.FoodListLastView]}
        onPress={() => { FoodInfo(item);  setFoodInfoModalVisible(true); }}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          {item.image_url && !imageError ? (
            <Image 
              source={{ uri: item.image_url }} 
              style={styles.FoodListViewImg} 
              contentFit="cover"
              transition={200}
              onLoad={handleImageLoad}
              onError={handleImageError}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>📦</Text>
            </View>
          )}
          {imageLoading && item.image_url && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingSpinner} />
            </View>
          )}
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={styles.FoodListViewTitle}>{item.name}</Text>
          <Text style={styles.FoodListViewContent}>수량: {item.count}</Text>
        </View>
      </TouchableOpacity>
    );
  });
  
  FoodCard.displayName = 'FoodCard';

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <View style={styles.container}>
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
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
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
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
        >
          {memoizedFoodList.map((item, index) => 
            renderFoodCard({ item, isLast: index === memoizedFoodList.length - 1 })
          )}
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
              <ScrollView style={{paddingLeft: 10,paddingRight: 10,flex: 1}}>
                <View style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'flex-start', gap: 20 }}>
                  <View>
                    <Image 
                      source={{ uri: selectedFood.image_url }} 
                      style={styles.FoodInfoModalImage} 
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
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
    </View>
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
    backgroundColor: '#fff',
    borderBottomColor: '#f4f4f4',
    borderBottomWidth: 1,
  },
  FoodListLastView: {
    height: Dimensions.get('window').height / 10,
    width: '100%',
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 0,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  FoodListViewImg: {
    width: (Dimensions.get('window').height / 10)-20,
    aspectRatio: 1,
    borderRadius: 6,
  },
  placeholderImage: {
    width: (Dimensions.get('window').height / 10)-20,
    height: (Dimensions.get('window').height / 10)-20,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  loadingSpinner: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderTopColor: 'transparent',
    borderRadius: 8,
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
    paddingTop: statusbarHeight,
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3.84,
        elevation: 5,
        maxHeight: '80%',
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
    gap: 6,
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
    marginBottom: 10,
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