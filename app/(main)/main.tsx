/**
 * REFACTORING NOTE:
 * 이 파일은 대규모 데이터 처리를 위해 최적화되고, 유지보수성을 높이기 위해 리팩토링된 메인 화면입니다.
 * 
 * [주요 변경 사항 및 최적화 내역]
 * 
 * 1. 관심사의 분리 (Separation of Concerns):
 *    - 비즈니스 로직을 Custom Hooks로 분리하여 컴포넌트의 복잡도를 낮추고 재사용성을 높였습니다.
 *      > useFoodList: 데이터 Fetching, 세션 관리, AppState(백그라운드 진입 등) 처리
 *      > useFoodFilter: 검색, 정렬(Sorting), 필터링 로직 (Memoization 적용)
 *      > useFoodSelection: 다중 선택 모드, 일괄 삭제 로직
 * 
 * 2. 렌더링 성능 최적화 (Rendering Optimization):
 *    - FlatList 최적화:
 *      > getItemLayout: 높이 계산 비용 제거 (고정 높이 사용 시 필수)
 *      > initialNumToRender / windowSize / maxToRenderPerBatch: 스크롤 속도에 맞춘 렌더링 제어
 *      > removeClippedSubviews: 화면 밖 컴포넌트 메모리 해제
 *    - Callback Memoization:
 *      > useCallback을 적극 활용하여 하위 컴포넌트(FoodItem)의 불필요한 리렌더링 방지
 * 
 * 3. Type Safety (타입 안정성):
 *    - API 응답 타입(ApiFoodItem)과 UI 확장 타입(FoodItem)을 명확히 구분하여 사용
 * 
 * 4. UX 개선:
 *    - 선택 모드(Selection Mode) 진입 시 상단 헤더가 Contextual Header로 변환
 */

import { FoodItemComponent } from '@/components/FoodItem';
import Header from '@/components/Header';
import MenuButtonAndModal from '@/components/features/MenuButtonAndModal';
import { useAppContext } from '@/contexts/AppContext';
import { useFoodFilter } from '@/hooks/useFoodFilter';
import { FoodItem, useFoodList } from '@/hooks/useFoodList';
import { useFoodSelection } from '@/hooks/useFoodSelection';
import { FoodItem as ApiFoodItem } from '@/services/api'; // 기본 API 타입 임포트
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MainScreen() {
  const router = useRouter();
  const { sessionId, userInfo, foodList } = useAppContext();

  // ---------------------------------------------------------------------------
  // Custom Hooks Initialization
  // ---------------------------------------------------------------------------

  // 1. 데이터 로드 및 관리 Hook
  // - 데이터 패칭, 당겨서 새로고침, 백그라운드 복귀 시 갱신 로직 포함
  const { fetchFoodList, refreshing, onRefresh } = useFoodList();

  // 2. 필터링 및 정렬 Hook
  // - 검색어(searchText)나 정렬 기준(sortType) 변경 시 useMemo로 최적화된 리스트 반환
  // - 원본 foodList는 건드리지 않고 필터링된 결과만 반환
  const { filteredFoodList, searchText, setSearchText, sortType, setSortType } = useFoodFilter(foodList as FoodItem[]);

  // 3. 선택 모드 및 일괄 삭제 Hook
  // - 롱프레스 시 선택 모드 진입, 선택/해제, 삭제 API 호출 로직 포함
  // - 삭제 후 목록 갱신을 위해 fetchFoodList 콜백 전달
  const {
    isSelectionMode,
    setIsSelectionMode,
    selectedFids,
    setSelectedFids,
    handleLongPress,
    toggleSelection,
    handleDeleteSelected
  } = useFoodSelection(sessionId, () => fetchFoodList(false));

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  // 아이템 클릭 핸들러
  // 선택 모드일 경우: 선택 토글
  // 일반 모드일 경우: 상세 페이지 이동
  const handlePress = useCallback((item: ApiFoodItem) => {
    if (isSelectionMode) {
      toggleSelection(item.fid);
    } else {
      router.push(`/food-detail?fid=${item.fid}`);
    }
  }, [isSelectionMode, toggleSelection, router]);

  // 롱프레스 핸들러 래퍼
  // FoodItemComponent는 ApiFoodItem 타입을 인자로 줄 수 있으나,
  // handleLongPress는 내부적으로 Extended Type(FoodItem)을 기대할 수 있음.
  // 실제로는 fid만 사용하므로 안전하게 캐스팅하여 전달.
  const handleLongPressWrapper = useCallback((item: ApiFoodItem) => {
    handleLongPress(item as FoodItem);
  }, [handleLongPress]);

  // 정렬 버튼 핸들러
  const handleSortPress = useCallback(() => {
    const { Alert } = require('react-native'); // Alert Lazy Loading (Optional optimization)
    Alert.alert(
      '정렬 기준 선택',
      undefined,
      [
        { text: '유통기한 임박순', onPress: () => setSortType('expiry') },
        { text: '이름순 (가나다)', onPress: () => setSortType('name') },
        { text: '최신 등록순', onPress: () => setSortType('created') },
        { text: '취소', style: 'cancel' }
      ]
    );
  }, [setSortType]);

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------

  // FlatList Render Item
  // useCallback을 통해 불필요한 함수 재생성 방지 -> FlatList 스크롤 성능 향상 핵심
  const renderItem = useCallback(({ item }: { item: FoodItem }) => {
    const isSelected = selectedFids.includes(item.fid);

    return (
      <View className="relative">
        <FoodItemComponent
          food={item}
          onPress={handlePress}
          onLongPress={handleLongPressWrapper}
        />
        {/* 선택 모드 오버레이 (조건부 렌더링) */}
        {isSelectionMode && (
          <View
            className={`absolute inset-0 rounded-xl justify-center items-end pr-5 ${isSelected ? 'bg-blue-500/10 border border-blue-500' : 'bg-white/50'}`}
            pointerEvents="none"
          >
            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
          </View>
        )}
      </View>
    );
  }, [isSelectionMode, selectedFids, handlePress, handleLongPressWrapper]);

  return (
    <SafeAreaView className="flex-1 bg-[#F2F4F6]">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* 
        Header Area 
        선택 모드 여부에 따라 헤더 UI를 조건부 렌더링
      */}
      {isSelectionMode ? (
        <View className="flex-row justify-between items-center px-5 py-4">
          <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedFids([]); }}>
            <Text className="text-gray-600 text-lg font-bold">취소</Text>
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

      {/* 
        Profile Card 
        선택 모드일 때는 화면 복잡도를 줄이기 위해 숨김 처리
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

      {/* Food List Container */}
      <View className="flex-1 bg-white mx-5 mt-5 mb-1 rounded-2xl p-2.5" style={{ elevation: 3 }}>

        {/* Search and Sort Controls */}
        <View className="flex-row items-center mb-3 px-2 pt-2 gap-2">
          {/* 검색 바 */}
          <View className="flex-1 flex-row items-center bg-gray-50 rounded-xl px-3 h-11 border border-gray-200">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 text-base text-gray-800"
              placeholder="식품명 검색"
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          {/* 정렬 버튼 */}
          <TouchableOpacity
            onPress={handleSortPress}
            className={`w-11 h-11 rounded-xl items-center justify-center border ${sortType !== 'expiry' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
          >
            <Ionicons name="filter" size={20} color={sortType !== 'expiry' ? '#007AFF' : '#6B7280'} />
          </TouchableOpacity>
        </View>

        {/* 전체 선택 버튼 (선택 모드 전용) */}
        {isSelectionMode && (
          <View className="flex-row justify-between items-center mb-3 px-2 pt-1">
            <TouchableOpacity
              className="bg-gray-100 px-3 py-2 rounded-lg"
              onPress={() => {
                const allSelected = selectedFids.length === filteredFoodList.length && filteredFoodList.length > 0;
                setSelectedFids(allSelected ? [] : filteredFoodList.map(item => item.fid));
              }}
            >
              <Text className="text-gray-800 font-semibold">
                {selectedFids.length === filteredFoodList.length && filteredFoodList.length > 0 ? '전체 해제' : '전체 선택'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 
          Main Food List 
          성능 최적화가 강력하게 적용된 FlatList
        */}
        <FlatList
          data={filteredFoodList} // 필터링된 데이터 사용
          renderItem={renderItem}
          keyExtractor={item => item.fid}
          contentContainerStyle={{ paddingBottom: 20 }}

          // --- 성능 최적화 Props ---
          initialNumToRender={10}      // 초기 렌더링 개수 (화면에 꽉 찰 만큼)
          windowSize={5}               // 렌더링 윈도우 크기 (화면 높이 x 5)
          maxToRenderPerBatch={10}     // 배치당 렌더링 개수
          removeClippedSubviews={true} // 화면 밖 아이템 언마운트
          // 고정 높이 아이템일 경우 레이아웃 계산 생략 (매우 중요)
          getItemLayout={(data, index) => (
            { length: 110, offset: 110 * index, index }
          )}

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

      {/* 
        Menu & Modal Component 
        필터링되지 않은 원본 foodList를 전달하여 AI 레시피 추천 시 전체 목록을 활용할 수 있게 함
      */}
      <MenuButtonAndModal foodList={foodList} />
    </SafeAreaView>
  );
}