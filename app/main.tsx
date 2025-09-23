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
import BarcodeScan from './BarcodeScan';
import { GlobalStyles, Colors, Spacing, FontSizes, BorderRadius, ScreenStyles } from '../styles/GlobalStyles';

type FoodItem = {
  barcode: string;
  count: number;
  created_at: string;
  description: string;
  ingredients?: string;
  days_remaining?: number;
  expiration_date: string;
  expiration_date_desc: string;
  fid: string;
  image_url: string;
  name: string;
  type: string;
  uid: string;
  volume: string;
  is_active?: number;
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

  // 5초마다 유저 정보와 식품 리스트 갱신
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
        
        // 유저 정보 갱신
        const userResponse = await authAPI.getUserInfo(sessionResponse.data.session_info.uid);
        setUserInfo(userResponse.data.user_info);
        
        // 식품 리스트 갱신
        try {
          const foodResponse = await foodAPI.getFoodList(sessionId);
          if (foodResponse.code === 200) {
            setFoodList(foodResponse.data.food_list);
            // 새로운 이미지들 프리로딩
            const imageUrls = foodResponse.data.food_list
              .map(food => food.image_url)
              .filter(url => url && url.trim() !== '');
            preloadImages(imageUrls);
          }
        } catch (foodError: any) {
          console.error('Food list refresh error:', foodError?.response);
          // 식품 리스트 갱신 실패는 조용히 처리 (사용자에게 알리지 않음)
        }
        
      } catch (error: any) {
        console.error('Periodic update error:', error?.response);
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
              if (!sessionId) {
                Alert.alert('오류', '세션이 만료되었습니다. 다시 로그인하세요.');
                return;
              }
              
              if (!fid) {
                Alert.alert('오류', '식품 정보가 올바르지 않습니다.');
                return;
              }
              
              console.log('Deleting food with fid:', fid); // 디버깅용 로그
              const response = await foodAPI.deleteFood(sessionId, fid);
              console.log('Delete response:', response); // 디버깅용 로그
              
              if (response && response.code === 200) {
                // 모달을 먼저 닫고
                setFoodInfoModalVisible(false);
                setSelectedFood(null);
                
                // 성공 메시지 표시
                Alert.alert('삭제 완료', response.message || '식품이 성공적으로 삭제되었습니다.');
                
                // 리스트 갱신
                await onRefresh();
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
            }
          },
        },
      ]
    );
  };

  // 식품 정보 설정 (리스트의 기본 정보 사용)
  const FoodInfo = async (item: FoodItem) => {
    try {
      // 먼저 기본 정보로 모달을 열어줌 (빠른 응답)
      setSelectedFood(item);
      
      // 그 다음 상세 정보를 가져와서 업데이트 (선택사항)
      if (item.fid && sessionId) {
        try {
          const response = await foodAPI.getFoodInfo(sessionId, item.fid);
          
          if (response.code === 200) {
            const foodInfo = response.data.food_info;
            setSelectedFood(foodInfo); // 상세 정보로 업데이트
          }
        } catch (detailError: any) {
          console.error('Detail info fetch failed:', detailError);
          // 상세 정보 가져오기 실패해도 기본 정보로 모달은 열림
        }
      }
    } catch (error: any) {
      console.error('FoodInfo error:', error);
      Alert.alert('오류', '식품 정보를 불러오지 못했습니다.');
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

  const handleProfileEdit = () => {
    router.push('/profile-edit');
  };

  return (
    <View style={GlobalStyles.container}>
      {/* Header */}
      <View style={GlobalStyles.header}>
        <Text style={GlobalStyles.headerTitle}>SmileFood</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.chatHistoryButton} onPress={() => router.push('/chat-list')}>
            <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
            <Text style={styles.settingsButtonText}>설정</Text>
          </TouchableOpacity>
        </View>
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
              <TouchableOpacity onPress={() => setFoodInfoModalVisible(false)} style={styles.backButton}>
                <Ionicons name='arrow-back' size={24}  color="#007AFF"/>
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
                    {selectedFood.ingredients && (
                      <View style={styles.FoodInfoModalInfo}>
                        <Text style={styles.FoodInfoModalInfoTitle}>원재료명</Text>
                        <Text style={styles.FoodInfoModalText}>{selectedFood.ingredients}</Text>
                      </View>
                    )}
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
  // 헤더 버튼들
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  chatHistoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.background,
  },

  // 설정 버튼 (특화 스타일)
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
    ...GlobalStyles.cardWithMargin,
    height: Dimensions.get('window').height / 1.6,
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
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
});