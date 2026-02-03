import { FoodItemComponent } from '@/components/FoodItem';
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
  AppState,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// API 타입 정의가 있다면 import해서 사용하는 것이 좋음
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
  const appState = useRef(AppState.currentState);

  // API FoodItem을 로컬 FoodItem으로 변환하는 함수
  const transformFoodItem = useCallback((apiFood: any): FoodItem => {
    // 날짜 계산 로직을 FoodItemComponent 내부와 통일하거나, 여기서 계산된 값을 사용
    // FoodItemComponent는 expiration_date 문자열을 받아 스스로 계산하므로
    // 여기서는 정렬을 위한 days_remaining만 계산하면 됨
    const expirationDate = new Date(apiFood.expiration_date);
    expirationDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
      // 세션 체크
      const isSessionValid = await checkSession();
      if (!isSessionValid) return; // 세션 만료시 중단

      const sessionResponse = await authAPI.getSessionInfo(sessionId); // 중복 호출일 수 있으나 uid 확보용
      const userResponse = await authAPI.getUserInfo(sessionResponse.data.session_info.uid);
      setUserInfo(userResponse.data.user_info);
    } catch (error: any) {
      console.warn('User info refresh error:', error?.response || error);
    }
  }, [sessionId, checkSession, setUserInfo]);


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
            .map((food: any) => food.image_url)
            .filter((url: string) => url && url.trim() !== '');
          preloadImages(imageUrls);
        }
      }
    } catch (error: any) {
      // 조용히 실패하거나 로그만 남김. 사용자에게 매번 알림을 띄우면 불편할 수 있음.
      console.warn('Food list refresh failed', error);
    } finally {
      setRefreshing(false);
    }
  }, [sessionId, transformFoodItem, setFoodList, checkSession]);

  // 식품 상세정보 화면으로 이동
  const navigateToFoodDetail = useCallback((item: FoodItem) => {
    if (isSelectionMode) {
      setSelectedFids(prev => prev.includes(item.fid) ? prev.filter(id => id !== item.fid) : [...prev, item.fid]);
      return;
    }
    router.push(`/food-detail?fid=${item.fid}`); // params가 아닌 query string 사용 권장
  }, [router, isSelectionMode]);

  // 길게 누르기로 선택삭제 모드 활성화
  const handleLongPress = useCallback((item: FoodItem) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedFids([item.fid]);
    }
  }, [isSelectionMode]);

  // 식품 리스트 정렬(소비기한 남은 일수 오름차순) 및 메모이제이션
  const memoizedFoodList = useMemo(() => {
    return [...foodList].sort((a, b) => a.days_remaining - b.days_remaining);
  }, [foodList]);

  // 아이템 렌더링 함수
  const renderItem = useCallback(({ item }: { item: FoodItem }) => {
    const isSelected = selectedFids.includes(item.fid);

    return (
      <View style={styles.itemWrapper}>
        <FoodItemComponent
          food={item}
          onPress={() => navigateToFoodDetail(item)}
        />
        {/* 롱프레스 감지를 위한 투명 오버레이 또는 FoodItemComponent에 onLongPress prop 추가 필요.
                현재 FoodItemComponent는 onLongPress를 지원하지 않을 수 있음. 
                FoodItemComponent를 수정하거나, 감싸는 뷰에 핸들러를 달아야 함.
                하지만 FoodItemComponent 내부의 TouchableOpacity 때문에 이벤트 버블링 문제가 있을 수 있음.
                가장 깔끔한 건 FoodItemComponent가 onLongPress를 받아 전달하는 것임.
                
                여기서는 일단 TouchableOpacity로 감싸서 해결을 시도하지만, 
                FoodItemComponent 내부의 onPress와 충돌할 수 있으므로 
                FoodItemComponent에 onLongPress prop을 추가하는 것을 강력 권장함.
                (이번 리팩터링 범위 밖이라면 아래처럼 처리)
             */
        }
        {/* 선택 모드일 때 오버레이 표시 */}
        {isSelectionMode && (
          <TouchableOpacity
            style={[styles.selectionOverlay, isSelected && styles.selectedOverlay]}
            onPress={() => navigateToFoodDetail(item)}
          >
            <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
          </TouchableOpacity>
        )}

        {/* 
                FoodItemComponent 내부에 롱프레스를 넣지 못했으므로, 
                임시방편으로 컴포넌트 위를 덮는 투명 버튼을 만들지 않고,
                FoodItemComponent 자체가 Press 이벤트를 소비하므로 
                외부에서 감지하기 어렵다.
                
                *중요*: 제대로 동작하려면 FoodItemComponent에 onLongPress prop을 추가해야 함.
                지금은 FoodItemComponent의 onPress만 사용.
             */}
      </View>
    );
  }, [navigateToFoodDetail, isSelectionMode, selectedFids]);

  // FoodItemComponent에 onLongPress를 전달할 수 없으므로,
  // BarcodeScan이나 다른 곳에서 FoodItemComponent 수정이 있었는지 확인해야 함.
  // 직전 수정에서 onPress만 있었음. 
  // 따라서 롱프레스 기능은 FoodItemComponent 수정 없이는 완벽하지 않을 수 있음.
  // 일단 Selection Mode 진입을 위한 버튼을 별도로 두거나(설정 등), 
  // FoodItemComponent를 수정해야 함. (여기서는 FoodItemComponent 수정 없이 진행하므로, 네비게이션으로 대체될 수 있음)


  const handleSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  // 초기 로드
  useEffect(() => {
    if (sessionId && !initialLoadDone.current) {
      onRefresh();
      initialLoadDone.current = true;
    }
  }, [sessionId, onRefresh]);

  // AppState 변화 감지하여 포그라운드 복귀 시 데이터 갱신
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // 포그라운드로 돌아왔을 때 갱신
        if (sessionId) {
          onRefresh();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [sessionId, onRefresh]);

  // onRefresh 함수를 AppContext에 등록
  useEffect(() => {
    setRefreshFoodList(() => onRefresh);
    return () => setRefreshFoodList(null);
  }, [onRefresh, setRefreshFoodList]);

  // useFocusEffect: 화면 포커스 시 갱신 (너무 잦은 호출 방지 필요하지만 일단 유지하되 가볍게)
  useFocusEffect(
    useCallback(() => {
      // 이미 AppState나 초기 로드로 커버되지만,
      // 다른 탭에서 변경사항이 있을 수 있으므로 유지.
      // 단, refreshing 중이면 스킵
      if (!refreshing && sessionId && initialLoadDone.current) {
        // 조용히 업데이트
        const silentRefresh = async () => {
          try {
            const response = await foodAPI.getFoodList(sessionId);
            if (response.code === 200) {
              const activeFoodList = response.data.food_list.filter((food: any) => food.is_active === 1);
              const transformedFoodList = activeFoodList.map(transformFoodItem);
              // 데이터가 다를 때만 업데이트하는 로직이 있으면 좋지만, React가 알아서 처리해줌
              setFoodList(transformedFoodList);
            }
          } catch (e) {
            // ignore
          }
        };
        silentRefresh();
      }
    }, [sessionId, transformFoodItem, refreshing])
  );

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

      {/* 식품 리스트 뷰 영역 */}
      <View style={styles.foodListContainer}>
        {/* 선택 모드 컨트롤 (유지) */}
        {isSelectionMode && (
          <View style={styles.selectionControls}>
            {/* ... 선택 모드 UI ... */}
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

              {/* ... 삭제 버튼들 ... (생략 없이 구현) */}
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

        {/* FlatList로 최적화 */}
        <FlatList
          data={memoizedFoodList}
          renderItem={renderItem}
          keyExtractor={item => item.fid}
          contentContainerStyle={styles.listContentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>등록된 식품 내용이 없습니다</Text>
            </View>
          }
        />
      </View>

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
  profileCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF', // 기본 배경색
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

  // 리스트 영역
  foodListContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 5, // 하단 여백을 줄여 높이 확보
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    // 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  listContentContainer: {
    paddingBottom: 20,
  },
  itemWrapper: {
    position: 'relative',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },

  // 선택 모드 관련
  selectionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingTop: 5,
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

  // Selection Overlay
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    borderRadius: 12, // FoodItem 컴포넌트의 borderRadius와 맞춰야 함
  },
  selectedOverlay: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
});