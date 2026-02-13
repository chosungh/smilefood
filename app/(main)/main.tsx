/**
 * REFACTORING NOTE:
 * 이 파일은 기존 코드를 Tailwind CSS로 변환하고 로직을 최적화한 버전입니다.
 * 
 * 주요 변경 사항:
 * 1. Styling: StyleSheet를 모두 제거하고 NativeWind(Tailwind CSS) className으로 교체했습니다.
 *    - 이유: 코드 양을 줄이고, 전역적인 디자인 일관성을 유지하기 위함입니다.
 * 
 * 2. Type System: 로컬 FoodItem 타입 정의를 제거하고 services/api의 타입을 확장했습니다.
 *    - 이유: API 응답 타입과 UI 타입의 불일치를 방지하고 유지보수성을 높이기 위함입니다.
 * 
 * 3. Data Fetching (fetchFoodList):
 *    - 기존: onRefresh와 useFocusEffect 내부의 로직이 중복되어 있었습니다.
 *    - 변경: fetchFoodList 함수 하나로 통합하고 isSilent 파라미터로 로딩 인디케이터 표시 여부를 제어합니다.
 *    - 이유: 로직 중복을 제거하여 버그 발생 가능성을 낮추고 관리를 용이하게 했습니다.
 * 
 * 4. UX Improvements:
 *    - 선택 모드(Selection Mode) 진입 시 헤더가 변경되도록 개선했습니다.
 *    - FoodItem 컴포넌트에 onLongPress를 직접 전달하여 제스처 충돌을 방지했습니다.
 */
import { FoodItemComponent } from '@/components/FoodItem';
import Header from '@/components/Header';
import MenuButtonAndModal from '@/components/features/MenuButtonAndModal';
import { useAppContext } from '@/contexts/AppContext';
import { FoodItem as ApiFoodItem, authAPI, foodAPI } from '@/services/api';
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
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Refactoring: API 타입을 import하여 확장 (Type Safety 강화)
type FoodItem = ApiFoodItem & {
  days_remaining: number;
};

export default function MainScreen() {
  const router = useRouter();
  const { setIsLoggedIn, setSessionId, sessionId, userInfo, setUserInfo, setRefreshFoodList, showAlert, foodList, setFoodList } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const initialLoadDone = useRef(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedFids, setSelectedFids] = useState<string[]>([]);
  const appState = useRef(AppState.currentState);

  const transformFoodItem = useCallback((apiFood: ApiFoodItem): FoodItem => {
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

  // Refactoring: 중복된 데이터 호출 로직을 하나의 함수로 통합 (DRY 원칙)
  // isSilent: 당겨서 새로고침(false) vs 포그라운드 진입 시 조용히 갱신(true)
  const fetchFoodList = useCallback(async (isSilent = false) => {
    if (!sessionId) return;

    if (!isSilent) setRefreshing(true);
    try {
      const isSessionValid = await checkSession();
      if (!isSessionValid) {
        if (!isSilent) setRefreshing(false);
        return;
      }

      const response = await foodAPI.getFoodList(sessionId);
      if (response.code === 200) {
        const activeFoodList = response.data.food_list.filter((food) => food.is_active === 1);
        const transformedFoodList = activeFoodList.map(transformFoodItem);
        setFoodList(transformedFoodList);

        const imageUrls = activeFoodList
          .slice(0, 20) // Limit preloading to first 20 items to avoid memory spike
          .map((food) => food.image_url)
          .filter((url) => url && url.trim() !== '');
        preloadImages(imageUrls);
      }
    } catch (error: any) {
      if (!isSilent) console.warn('Food list refresh failed', error);
    } finally {
      if (!isSilent) setRefreshing(false);
    }
  }, [sessionId, transformFoodItem, checkSession]);

  const onRefresh = useCallback(() => {
    fetchFoodList(false);
  }, [fetchFoodList]);

  const navigateToFoodDetail = useCallback((item: FoodItem) => {
    if (isSelectionMode) {
      setSelectedFids(prev => prev.includes(item.fid) ? prev.filter(id => id !== item.fid) : [...prev, item.fid]);
      return;
    }
    router.push(`/food-detail?fid=${item.fid}`);
  }, [router, isSelectionMode]);

  const handleLongPress = useCallback((item: FoodItem) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedFids([item.fid]);
    }
  }, [isSelectionMode]);

  const handleDeleteSelected = useCallback(() => {
    if (!sessionId || selectedFids.length === 0) return;

    Alert.alert(
      '선택 삭제',
      `${selectedFids.length}개 식품을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              // Promise.all for better performance if API supports parallel
              await Promise.all(selectedFids.map(fid =>
                foodAPI.deleteFood(sessionId, fid).catch(e => console.warn(`Failed to delete ${fid}`, e))
              ));
              await fetchFoodList(false);
            } finally {
              setSelectedFids([]);
              setIsSelectionMode(false);
            }
          }
        }
      ]
    );
  }, [sessionId, selectedFids, fetchFoodList]);

  const memoizedFoodList = useMemo(() => {
    return [...foodList].sort((a, b) => a.days_remaining - b.days_remaining);
  }, [foodList]);

  const renderItem = useCallback(({ item }: { item: FoodItem }) => {
    const isSelected = selectedFids.includes(item.fid);

    return (
      <View className="relative">
        {/* Refactoring: onLongPress를 컴포넌트에 직접 전달하여 이벤트 버블링 문제 해결 */}
        <FoodItemComponent
          food={item}
          onPress={() => navigateToFoodDetail(item)}
          onLongPress={() => handleLongPress(item)}
        />
        {isSelectionMode && (
          <View
            className={`absolute inset-0 rounded-xl justify-center items-end pr-5 ${isSelected ? 'bg-blue-500/10 border-2 border-blue-500' : 'bg-white/50'}`}
            pointerEvents="none"
          >
            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
          </View>
        )}
      </View>
    );
  }, [navigateToFoodDetail, handleLongPress, isSelectionMode, selectedFids]);



  useEffect(() => {
    if (sessionId && !initialLoadDone.current) {
      fetchFoodList(false);
      initialLoadDone.current = true;
    }
  }, [sessionId, fetchFoodList]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (sessionId) {
          fetchFoodList(false);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [sessionId, fetchFoodList]);

  useEffect(() => {
    setRefreshFoodList(() => onRefresh);
    return () => setRefreshFoodList(null);
  }, [onRefresh, setRefreshFoodList]);

  // Refactoring: 포커스 시 silent 모드로 갱신하여 사용자 경험 저해 없이 데이터 동기화
  useFocusEffect(
    useCallback(() => {
      if (!refreshing && sessionId && initialLoadDone.current) {
        fetchFoodList(true);
      }
    }, [sessionId, refreshing, fetchFoodList])
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F2F4F6]">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      {isSelectionMode ? (
        <View className="flex-row justify-between items-center px-5 py-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedFids([]); }}>
            <Text className="text-gray-600 text-lg">취소</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold">{selectedFids.length}개 선택됨</Text>
          <TouchableOpacity
            onPress={handleDeleteSelected}
            disabled={selectedFids.length === 0}
          >
            <Text className={`text-lg font-bold ${selectedFids.length > 0 ? 'text-red-500' : 'text-gray-300'}`}>삭제</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Header />
      )}

      {/* Profile Card - Hide in selection mode for cleaner UI, or keep it. I'll hide it to specific focus on list.
          Actually user didn't ask to hide it, but standard apps do. I will keep it but maybe disable interaction?
          Let's keep it visible but maybe `opacity-50` if selection mode?
          The original kept it. I will keep it for now.
      */}
      {!isSelectionMode && (
        <TouchableOpacity className="bg-white mx-5 mt-5 rounded-2xl p-5" onPress={() => router.push('/profile-edit')} style={{ elevation: 3 }}>
          <View className="flex-row items-center">
            <View className={`w-16 h-16 rounded-full justify-center items-center mr-4 ${userInfo?.profile_url ? 'bg-white' : 'bg-blue-500'}`}>
              {userInfo?.profile_url ? (
                <Image
                  source={{ uri: userInfo.profile_url }}
                  className="w-16 h-16 rounded-full"
                  style={{ width: 64, height: 64, borderRadius: 32 }}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="none"
                />
              ) : (
                <Text className="text-white text-2xl font-bold">
                  {userInfo?.name?.charAt(0) || 'A'}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-800 mb-1">{userInfo?.name || 'username'}</Text>
              <Text className="text-sm text-gray-500">{userInfo?.email || 'user@example.com'}</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Food List Area */}
      <View className="flex-1 bg-white mx-5 mt-5 mb-1 rounded-2xl p-2.5" style={{ elevation: 3 }}>

        {/* Selection Actions inside list - removed because I moved actions to Header which is standard */}
        {isSelectionMode && (
          <View className="flex-row justify-between items-center mb-3 px-2 pt-1">
            <TouchableOpacity
              className="bg-gray-100 px-3 py-2 rounded-lg"
              onPress={() => {
                const allSelected = selectedFids.length === memoizedFoodList.length && memoizedFoodList.length > 0;
                setSelectedFids(allSelected ? [] : memoizedFoodList.map(item => item.fid));
              }}
            >
              <Text className="text-gray-800 font-semibold">
                {selectedFids.length === memoizedFoodList.length && memoizedFoodList.length > 0 ? '전체 해제' : '전체 선택'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={memoizedFoodList}
          renderItem={renderItem}
          keyExtractor={item => item.fid}
          contentContainerStyle={{ paddingBottom: 20 }}
          initialNumToRender={10}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-16">
              <Text className="text-4xl mb-4">🍽️</Text>
              <Text className="text-base text-gray-400 text-center">
                냉장고가 비었습니다.{'\n'}새로운 식품을 등록해보세요!
              </Text>
            </View>
          }
        />
      </View>

      <MenuButtonAndModal foodList={memoizedFoodList} />
    </SafeAreaView>
  );
}