import MenuButtonAndModal from '@/components/MenuButtonAndModal';
import { useAppContext } from '@/contexts/AppContext';
import { authAPI, foodAPI } from '@/services/api';
import { preloadImages } from '@/utils/imageCache';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FoodItem = {
  barcode: string;
  count: number;
  created_at: string;
  description: string;
  days_remaining: number;
  ingredients: string;
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

export default function MainScreen() {
  const router = useRouter();
  const { setIsLoggedIn, setSessionId, sessionId, userInfo, setUserInfo, setRefreshFoodList, showAlert } = useAppContext();
  const [foodList, setFoodList] = useState<FoodItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const initialLoadDone = useRef(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedFids, setSelectedFids] = useState<string[]>([]);

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
        showAlert('세션 만료', '세션이 만료되었습니다. 다시 로그인하세요.');
        await setSessionId(null);
        await setUserInfo(null);
        await setIsLoggedIn(false);
        router.replace('/login');
        return false;
      }

      return true;
    } catch (error: any) {
      console.warn('Session check error:', error?.response || error);
      return false;
    }
  }, [sessionId, showAlert, setSessionId, setUserInfo, setIsLoggedIn, router]);

  // 유저 정보 새로고침 함수
  const refreshUserInfo = useCallback(async () => {
    if (!sessionId) return;

    try {
      const sessionResponse = await authAPI.getSessionInfo(sessionId);

      if (sessionResponse.data.session_info.is_active === 0) {
        showAlert('세션 만료', '세션이 만료되었습니다. 다시 로그인하세요.');
        await setSessionId(null);
        await setUserInfo(null);
        await setIsLoggedIn(false);
        router.replace('/login');
        return;
      }

      const userResponse = await authAPI.getUserInfo(sessionResponse.data.session_info.uid);
      setUserInfo(userResponse.data.user_info);
    } catch (error: any) {
      console.warn('User info refresh error:', error?.response || error);
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
    if (isSelectionMode) {
      setSelectedFids(prev => prev.includes(item.fid) ? prev.filter(id => id !== item.fid) : [...prev, item.fid]);
      return;
    }
    router.push(`/food-detail?fid=${item.fid}`);
  }, [router, isSelectionMode]);

  // 길게 누르기로 선택삭제 모드 활성화
  const handleLongPress = useCallback((item: FoodItem) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedFids([item.fid]);
    }
  }, [isSelectionMode]);

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
              // console.warn('Error deleting food:', error);
              showAlert('오류', '식품 삭제 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  }, [sessionId, onRefresh, showAlert]);

  // 식품 리스트 정렬(소비기한 남은 일수 오름차순) 및 메모이제이션
  const memoizedFoodList = useMemo(() => {
    return [...foodList].sort((a, b) => a.days_remaining - b.days_remaining);
  }, [foodList]);

  // FoodCard 컴포넌트를 메모이제이션하여 불필요한 리렌더링 방지
  const renderFoodCard = useCallback(({ item, isLast }: { item: FoodItem, isLast?: boolean }) => {
    return (
      <FoodCard
        key={item.fid}
        item={item}
        isLast={isLast}
        onPress={navigateToFoodDetail}
        onLongPress={handleLongPress}
        showCheckbox={isSelectionMode}
        selected={selectedFids.includes(item.fid)}
      />
    );
  }, [navigateToFoodDetail, handleLongPress, isSelectionMode, selectedFids]);

  const handleSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  // 초기 로드 - sessionId가 변경될 때만 실행
  useEffect(() => {
    if (sessionId && !initialLoadDone.current) {
      const loadInitialData = async () => {
        try {
          // 세션 체크
          const isSessionValid = await checkSession();
          if (!isSessionValid) return;

          // 유저 정보 가져오기 (세션 정보를 통해 uid 추출)
          const sessionResponse = await authAPI.getSessionInfo(sessionId);
          const userResponse = await authAPI.getUserInfo(sessionResponse.data.session_info.uid);
          setUserInfo(userResponse.data.user_info);

          // 식품 리스트 가져오기 (초기 로드 시에만)
          try {
            const foodResponse = await foodAPI.getFoodList(sessionId);
            if (foodResponse.code === 200) {
              // 활성화된 아이템만 필터링하여 변환
              const activeFoodList = foodResponse.data.food_list.filter((food: any) => food.is_active === 1);
              const transformedFoodList = activeFoodList.map(transformFoodItem);
              setFoodList(transformedFoodList);
              // 이미지 프리로딩 (활성화된 아이템만)
              const imageUrls = activeFoodList
                .map(food => food.image_url)
                .filter(url => url && url.trim() !== '');
              preloadImages(imageUrls);
            }
          } catch (error: any) {
            console.warn('Food list load error:', error?.response || error);
            // Alert.alert('오류', error.response?.data?.message || '식품 목록을 불러오는 중 오류가 발생했습니다.');
          }

          initialLoadDone.current = true;
        } catch (error: any) {
          console.warn('Initial load error:', error?.response || error);
        }
      };

      loadInitialData();
    }
  }, [sessionId, transformFoodItem, checkSession, setUserInfo, setFoodList]);

  // 5초마다 세션 체크 및 유저 정보 갱신
  useEffect(() => {
    if (!sessionId || !initialLoadDone.current) return;

    const interval = setInterval(async () => {
      // 세션 체크
      const isSessionValid = await checkSession();
      if (!isSessionValid) return;

      // 유저 정보 새로고침
      await refreshUserInfo();
    }, 5000);

    return () => {
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
            console.warn('Error refreshing food list:', error);
          }
        };

        refreshFoodList();
      }
    }, [sessionId, transformFoodItem, setFoodList, checkSession])
  );

  // 식품 리스트 뷰 생성
  const FoodCard = React.memo(({ item, isLast, onPress, onLongPress, showCheckbox, selected }: { item: FoodItem, isLast?: boolean, onPress: (item: FoodItem) => void, onLongPress: (item: FoodItem) => void, showCheckbox?: boolean, selected?: boolean }) => {
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
        style={[
          styles.FoodListView,
          isLast && styles.FoodListLastView
        ]}
        onPress={() => onPress(item)}
        onLongPress={() => onLongPress(item)}
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
          <Text style={[
            styles.FoodListViewContent,
            item.days_remaining <= 0 && styles.FoodListViewContentExpired,
            item.days_remaining > 0 && item.days_remaining <= 7 && styles.FoodListViewContentDanger,
            item.days_remaining > 7 && item.days_remaining <= 14 && styles.FoodListViewContentWarning
          ]}>
            {item.days_remaining <= 0
              ? '섭취에 주의하세요!'
              : `소비기한 만료까지: ${item.days_remaining}일`}
          </Text>
        </View>
        {showCheckbox && (
          <View style={[styles.selectCheckbox, selected && styles.selectCheckboxSelected]}>
            {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
        )}
      </TouchableOpacity>
    );
  });

  FoodCard.displayName = 'FoodCard';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SmileFood</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.chatHistoryButton} onPress={() => router.push('/chat-list')}>
            <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
            <Ionicons name="settings-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Card */}
      <TouchableOpacity style={styles.profileCard} onPress={() => router.push('/profile-edit')}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, userInfo?.profile_url && { backgroundColor: '#ffffff' }]}>
            {userInfo?.profile_url ? (
              <Image
                source={{ uri: userInfo.profile_url }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
                cachePolicy="none"
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
      </TouchableOpacity>

      {/* 식품 리스트 뷰 */}
      <View style={styles.MainFoodListView}>
        {isSelectionMode && (
          <View style={styles.selectionControls}>
            <Text style={styles.selectionCount}>선택됨: {selectedFids.length}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={styles.selectionActionButton}
                onPress={() => {
                  setIsSelectionMode(false);
                  setSelectedFids([]);
                }}
              >
                <Text style={styles.selectionActionText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionActionButton}
                onPress={() => {
                  const allSelected = selectedFids.length === memoizedFoodList.length && memoizedFoodList.length > 0;
                  setSelectedFids(allSelected ? [] : memoizedFoodList.map(item => item.fid));
                }}
              >
                <Text style={styles.selectionActionText}>
                  {selectedFids.length === memoizedFoodList.length && memoizedFoodList.length > 0 ? '전체 해제' : '전체 선택'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectionActionButton, selectedFids.length === 0 && styles.selectionActionDisabled]}
                onPress={() => {
                  if (!sessionId || selectedFids.length === 0) return;
                  Alert.alert(
                    '선택 삭제',
                    `${selectedFids.length}개 식품을 삭제하시겠습니까?`,
                    [
                      { text: '취소', style: 'cancel' },
                      {
                        text: '삭제', style: 'destructive',
                        onPress: async () => {
                          try {
                            for (const fid of selectedFids) {
                              try { await foodAPI.deleteFood(sessionId, fid); } catch (e) { }
                            }
                            await onRefresh();
                          } finally {
                            setSelectedFids([]);
                            setIsSelectionMode(false);
                          }
                        }
                      }
                    ]
                  );
                }}
                disabled={selectedFids.length === 0}
              >
                <Text style={[styles.selectionActionText, selectedFids.length === 0 && styles.selectionActionTextDisabled]}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    width: (Dimensions.get('window').height / 10) - 20,
    aspectRatio: 1,
    borderRadius: 6,
  },
  placeholderImage: {
    width: (Dimensions.get('window').height / 10) - 20,
    height: (Dimensions.get('window').height / 10) - 20,
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
  FoodListViewContentWarning: {
    color: '#ff9500',
    fontWeight: '600',
  },
  FoodListViewContentDanger: {
    color: '#ff3b30',
    fontWeight: '700',
  },
  FoodListViewContentExpired: {
    color: '#ff3b30',
    fontWeight: 'bold',
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
    marginBottom: 0,
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
    height: Dimensions.get('window').height / 1.5,
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
  },
  selectionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectionCount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  selectionActionButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  selectionActionDisabled: {
    opacity: 0.5,
  },
  selectionActionText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  selectionActionTextDisabled: {
    color: '#999',
  },
  selectCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginLeft: 8,
  },
  selectCheckboxSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  }
});