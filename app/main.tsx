import { authAPI, foodAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
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
import BarcodeScan from './BarcodeScan';
import { GlobalStyles, Colors, Spacing, FontSizes, BorderRadius, ScreenStyles } from '../styles/GlobalStyles';

type FoodItem = {
  barcode: string;
  count: number;
  created_at: string;
  description: string;
<<<<<<< HEAD
  ingredients?: string;
=======
  days_remaining: number;
>>>>>>> origin/szkotgh
  expiration_date: string;
  expiration_date_desc: string;
  fid: string;
  image_url: string;
  name: string;
  type: string;
  uid: string;
  volume: string;
  is_active: number;
};

const statusbarHeight = getStatusBarHeight();

export default function MainScreen() {
  const router = useRouter();
  const { setIsLoggedIn, setSessionId, sessionId, userInfo, setUserInfo, setRefreshFoodList, showAlert } = useAppContext();
  const [foodList, setFoodList] = useState<FoodItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const initialLoadDone = useRef(false);
  


  // API FoodItem을 로컬 FoodItem으로 변환하는 함수
  const transformFoodItem = useCallback((apiFood: any): FoodItem => {
    const expirationDate = new Date(apiFood.expiration_date);
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      ...apiFood,
      days_remaining: diffDays,
    };
  }, []);

  // 세션 체크 함수
  const checkSession = useCallback(async () => {
    if (!sessionId) return false;
    
    try {
      const sessionResponse = await authAPI.getSessionInfo(sessionId);
      
      if (sessionResponse.data.session_info.is_active === 0) {
        console.log('Session expired, redirecting to login');
        showAlert('세션 만료', '세션이 만료되었습니다. 다시 로그인하세요.');
        setSessionId(null);
        setUserInfo(null);
        setIsLoggedIn(false);
        router.replace('/login');
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error('Session check error:', error?.response || error);
      return false;
    }
  }, [sessionId, showAlert, setSessionId, setUserInfo, setIsLoggedIn, router]);

  // 유저 정보 새로고침 함수
  const refreshUserInfo = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const sessionResponse = await authAPI.getSessionInfo(sessionId);
      
      if (sessionResponse.data.session_info.is_active === 0) {
        console.log('Session expired during user info refresh, redirecting to login');
        showAlert('세션 만료', '세션이 만료되었습니다. 다시 로그인하세요.');
        setSessionId(null);
        setUserInfo(null);
        setIsLoggedIn(false);
        router.replace('/login');
        return;
      }
      
      const userResponse = await authAPI.getUserInfo(sessionResponse.data.session_info.uid);
      setUserInfo(userResponse.data.user_info);
      console.log('User info refreshed successfully');
    } catch (error: any) {
      console.error('User info refresh error:', error?.response || error);
    }
  }, [sessionId, showAlert, setSessionId, setUserInfo, setIsLoggedIn, router]);

  // pull-to-refresh 핸들러 - 식품 리스트만 갱신
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (sessionId) {
        // 세션 체크
        const isSessionValid = await checkSession();
        if (!isSessionValid) {
          setRefreshing(false);
          return;
        }
        
        const response = await foodAPI.getFoodList(sessionId);
        if (response.code === 200) {
          // 활성화된 아이템만 필터링하여 변환
          const activeFoodList = response.data.food_list.filter((food: any) => food.is_active === 1);
          const transformedFoodList = activeFoodList.map(transformFoodItem);
          setFoodList(transformedFoodList);
          // 이미지 프리로딩 (활성화된 아이템만)
          const imageUrls = activeFoodList
            .map(food => food.image_url)
            .filter(url => url && url.trim() !== '');
          preloadImages(imageUrls);
        }
      }
    } catch (error: any) {
      showAlert('오류', error.response?.data?.message || '식품 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setRefreshing(false);
    }
  }, [sessionId, transformFoodItem, setFoodList, showAlert, checkSession]);

  // 식품 상세정보 화면으로 이동
  const navigateToFoodDetail = useCallback((item: FoodItem) => {
    router.push(`/food-detail?fid=${item.fid}`);
  }, [router]);

  // 식품 삭제
  const DeleteFood = useCallback(async (fid: string) => {
    showAlert(
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
<<<<<<< HEAD
              if (!sessionId) {
                Alert.alert('오류', '세션이 만료되었습니다. 다시 로그인하세요.');
                return;
              }
              
              if (!fid) {
                Alert.alert('오류', '식품 정보가 올바르지 않습니다.');
                return;
              }
              
              const response = await foodAPI.deleteFood(sessionId, fid);
              console.log('Delete response:', response); // 디버깅용 로그
              
              if (response && response.code === 200) {
                Alert.alert('삭제 완료', response.message || '식품이 성공적으로 삭제되었습니다.');
                await onRefresh(); // 삭제 후 리스트 갱신
                setFoodInfoModalVisible(false);
              } else {
                console.error('Delete failed with response:', response);
                Alert.alert('오류', response?.message || '식품 삭제에 실패했습니다.');
              }
            } catch (error: any) {
              console.error('Error deleting food:', error);
              console.error('Error response:', error.response);
              
              // 더 구체적인 에러 메시지 제공
              let errorMessage = '식품 삭제 중 오류가 발생했습니다.';
              
              if (error.response) {
                // 서버 응답이 있는 경우
                if (error.response.status === 401) {
                  errorMessage = '인증이 만료되었습니다. 다시 로그인하세요.';
                } else if (error.response.status === 404) {
                  errorMessage = '삭제하려는 식품을 찾을 수 없습니다.';
                } else if (error.response.data?.message) {
                  errorMessage = error.response.data.message;
                }
              } else if (error.message) {
                // 네트워크 오류 등
                errorMessage = `네트워크 오류: ${error.message}`;
              }
              
              Alert.alert('오류', errorMessage);
=======
              if (sessionId && fid) {
                const response = await foodAPI.deleteFood(sessionId, fid);
                if (response.code === 200) {
                  // showAlert('삭제 완료', response.message);
                  onRefresh(); // 삭제 후 리스트 갱신
                } else {
                  showAlert('오류', '식품 삭제에 실패했습니다.');
                }
              }
            } catch (error) {
              // console.error('Error deleting food:', error);
              showAlert('오류', '식품 삭제 중 오류가 발생했습니다.');
>>>>>>> origin/szkotgh
            }
          },
        },
      ]
    );
  }, [sessionId, onRefresh, showAlert]);

  // 식품 리스트를 메모이제이션하여 불필요한 리렌더링 방지
  const memoizedFoodList = useMemo(() => foodList, [foodList]);
  
  // FoodCard 컴포넌트를 메모이제이션하여 불필요한 리렌더링 방지
  const renderFoodCard = useCallback(({ item, isLast }: { item: FoodItem, isLast?: boolean }) => {
    return <FoodCard key={item.fid} item={item} isLast={isLast} onPress={navigateToFoodDetail} />;
  }, [navigateToFoodDetail]);

  const handleSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  // 초기 로드 - sessionId가 변경될 때만 실행
  useEffect(() => {
    if (sessionId && !initialLoadDone.current) {
      console.log('Starting initial load...');
      const loadInitialData = async () => {
        try {
          // 세션 체크
          const isSessionValid = await checkSession();
          if (!isSessionValid) return;
          
          // 유저 정보 가져오기
          const userResponse = await authAPI.getUserInfo(sessionId);
          setUserInfo(userResponse.data.user_info);
          console.log('Initial user info loaded');

          // 식품 리스트 가져오기 (초기 로드 시에만)
          try {
            const foodResponse = await foodAPI.getFoodList(sessionId);
            if (foodResponse.code === 200) {
              // 활성화된 아이템만 필터링하여 변환
              const activeFoodList = foodResponse.data.food_list.filter((food: any) => food.is_active === 1);
              const transformedFoodList = activeFoodList.map(transformFoodItem);
              setFoodList(transformedFoodList);
              console.log('Initial food list loaded:', transformedFoodList.length, 'items');
              // 이미지 프리로딩 (활성화된 아이템만)
              const imageUrls = activeFoodList
                .map(food => food.image_url)
                .filter(url => url && url.trim() !== '');
                preloadImages(imageUrls);
            }
          } catch (error: any) {
            console.error('Food list load error:', error?.response || error);
            // Alert.alert('오류', error.response?.data?.message || '식품 목록을 불러오는 중 오류가 발생했습니다.');
          }
          
          initialLoadDone.current = true;
          console.log('Initial load completed');
        } catch (error: any) {
          console.error('Initial load error:', error?.response || error);
        }
      };

      loadInitialData();
    }
  }, [sessionId, transformFoodItem, checkSession, setUserInfo, setFoodList]);

  // 5초마다 세션 체크 및 유저 정보 갱신
  useEffect(() => {
    if (!sessionId || !initialLoadDone.current) return;

    console.log('Starting 5-second interval for session check and user info refresh');

    const interval = setInterval(async () => {
      console.log('Checking session and refreshing user info...');
      
      // 세션 체크
      const isSessionValid = await checkSession();
      if (!isSessionValid) return;
      
      // 유저 정보 새로고침
      await refreshUserInfo();
    }, 5000);

    return () => {
      console.log('Clearing 5-second interval');
      clearInterval(interval);
    };
  }, [sessionId, checkSession, refreshUserInfo]);

  // onRefresh 함수를 AppContext에 등록
  useEffect(() => {
    setRefreshFoodList(() => onRefresh);
    return () => setRefreshFoodList(null);
  }, [onRefresh, setRefreshFoodList]);

  // 화면이 포커스될 때마다 음식 리스트 새로고침
  useFocusEffect(
    useCallback(() => {
      if (sessionId && initialLoadDone.current) {
        const refreshFoodList = async () => {
          try {
            // 세션 체크
            const isSessionValid = await checkSession();
            if (!isSessionValid) return;
            
            const foodResponse = await foodAPI.getFoodList(sessionId);
            if (foodResponse.code === 200) {
              // 활성화된 아이템만 필터링하여 변환
              const activeFoodList = foodResponse.data.food_list.filter((food: any) => food.is_active === 1);
              const transformedFoodList = activeFoodList.map(transformFoodItem);
              setFoodList(transformedFoodList);
            }
          } catch (error) {
            console.error('Error refreshing food list:', error);
          }
        };
        
        refreshFoodList();
      }
    }, [sessionId, transformFoodItem, setFoodList, checkSession])
  );

  // 식품 리스트 뷰 생성
  const FoodCard = React.memo(({ item, isLast, onPress }: { item: FoodItem, isLast?: boolean, onPress: (item: FoodItem) => void }) => {
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
        onPress={() => onPress(item)}
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
          <Text style={styles.FoodListViewContent}>유통기한 만료까지: {item.days_remaining}일</Text>
        </View>
      </TouchableOpacity>
    );
  });
  
  FoodCard.displayName = 'FoodCard';

<<<<<<< HEAD
  const handleSettings = () => {
    router.push('/settings');
  };

  const handleProfileEdit = () => {
    router.push('/profile-edit');
  };

=======
>>>>>>> origin/szkotgh
  return (
    <View style={GlobalStyles.container}>
      {/* Header */}
<<<<<<< HEAD
      <View style={GlobalStyles.header}>
        <Text style={GlobalStyles.headerTitle}>SmileFood</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
          <Text style={styles.settingsButtonText}>설정</Text>
        </TouchableOpacity>
=======
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SmileFood</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.chatHistoryButton} onPress={() => router.push('/chat-list')}>
            <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
            <Text style={styles.settingsButtonText}>설정</Text>
          </TouchableOpacity>
        </View>
>>>>>>> origin/szkotgh
      </View>

      {/* Profile Card */}
      <TouchableOpacity style={GlobalStyles.cardWithMargin} onPress={handleProfileEdit}>
        <View style={GlobalStyles.rowBetween}>
          <View style={GlobalStyles.avatar}>
            {userInfo?.profile_url ? (
              <Image 
                source={{ uri: userInfo.profile_url }} 
                style={GlobalStyles.avatarImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            ) : (
              <Text style={GlobalStyles.avatarText}>
                {userInfo?.name?.charAt(0) || 'A'}
              </Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userInfo?.name || 'username'}</Text>
            <Text style={styles.userEmail}>{userInfo?.email || 'user@example.com'}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 식품 리스트 뷰 */}
      <View style={styles.MainFoodListView}>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {memoizedFoodList.length > 0 ? (
            memoizedFoodList.map((item, index) => 
              renderFoodCard({ item, isLast: index === memoizedFoodList.length - 1 })
            )
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>등록된 식품 정보가 없습니다</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <MenuButtonAndModal />
<<<<<<< HEAD
      
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
                      <Text style={styles.FoodInfoModalInfoTitle}>원재료명</Text>
                      <Text style={styles.FoodInfoModalText}>{selectedFood.ingredients}</Text>
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
=======
    </SafeAreaView>
>>>>>>> origin/szkotgh
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  // 설정 버튼 (특화 스타일)
=======
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatHistoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
>>>>>>> origin/szkotgh
  settingsButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.background,
  },
  settingsButtonText: {
    color: Colors.text.secondary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  // 프로필 정보 (특화 스타일)
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },

  // 메인 식품 리스트 뷰 (특화 스타일)
  MainFoodListView: {
<<<<<<< HEAD
    ...GlobalStyles.cardWithMargin,
    height: Dimensions.get('window').height / 2,
  },

  // 식품 리스트 아이템들 - 글로벌 스타일 사용
  FoodListView: ScreenStyles.foodListView,
  FoodListLastView: {
    ...ScreenStyles.foodListView,
    borderBottomWidth: 0,
  },
  imageContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  FoodListViewImg: ScreenStyles.foodListImage,
  placeholderImage: {
    ...GlobalStyles.placeholderImage,
    width: (Dimensions.get('window').height / 10) - 20,
    height: (Dimensions.get('window').height / 10) - 20,
  },
  placeholderText: {
    fontSize: FontSizes.xl,
  },
  loadingOverlay: GlobalStyles.loadingOverlay,
  loadingSpinner: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderTopColor: 'transparent',
    borderRadius: 8,
  },
  FoodListViewTitle: ScreenStyles.foodListTitle,
  FoodListViewContent: ScreenStyles.foodListContent,

  // 모달 스타일들 - 글로벌 스타일 사용
  ModalBackgroundShade: GlobalStyles.modalBackground,
  ModalBackground: GlobalStyles.modalContainer,
  ModalArrowBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    padding: Spacing.xl,
    zIndex: 20,
    borderRadius: BorderRadius.xl,
  },
  FoodInfoModalImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    ...GlobalStyles.shadow,
  },
  FoodInfoModalInfo: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    paddingLeft: Spacing.xl,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 6,
  },
  FoodInfoModalInfoTitle: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
  FoodInfoModalText: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
  },
  FoodInfoDeleteButton: {
    ...GlobalStyles.card,
    width: '100%',
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 기본 뷰 (재사용 가능)
  DefalutView: GlobalStyles.card,
=======
    backgroundColor: '#fff',
    height: Dimensions.get('window').height/1.6,
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  }
>>>>>>> origin/szkotgh
});