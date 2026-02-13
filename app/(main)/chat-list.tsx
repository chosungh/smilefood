/**
 * REFACTORING NOTE:
 * 이 파일은 기존 코드를 Tailwind CSS(NativeWind)로 변환하고 로직을 최적화한 버전입니다.
 *
 * 주요 변경 사항:
 * 1. Styling: StyleSheet를 모두 제거하고 NativeWind className으로 교체했습니다.
 *    - 이유: 코드 양을 줄이고, 전역적인 디자인 일관성을 유지하기 위함입니다.
 *
 * 2. Component: renderChatCard를 ChatCard 컴포넌트로 분리했습니다.
 *    - 이유: FlatList 렌더링 성능 향상(React.memo) 및 재사용성 확보를 위함입니다.
 *
 * 3. Data Fetching: useEffect와 useFocusEffect 중복 호출을 제거했습니다.
 *    - 이유: 화면 진입 시 API가 두 번 호출되는 문제를 방지합니다.
 *
 * 4. Type Safety: catch(error: any)를 axios.isAxiosError로 개선했습니다.
 *    - 이유: 타입 안전성을 높이고 에러 처리를 명확하게 합니다.
 *
 * 5. Utility: 날짜 포맷 로직을 utils/date.ts로 분리했습니다.
 *    - 이유: 프로젝트 전반에서 일관된 날짜 포맷을 사용하기 위함입니다.
 */
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import ChatCard from '@/components/ChatCard';
import Header from '@/components/Header';
import { useAppContext } from '@/contexts/AppContext';
import { ChatInfo, foodAPI, FoodItem } from '@/services/api';

type ChatListItem = {
  chat_info: ChatInfo;
  food_ids: string[];
};

export default function ChatListScreen() {
  const router = useRouter();
  const { sessionId } = useAppContext();

  const [chatList, setChatList] = useState<ChatListItem[]>([]);
  const [foodItems, setFoodItems] = useState<Record<string, FoodItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChatList = useCallback(async () => {
    if (!sessionId) return;

    try {
      setError(null);
      const response = await foodAPI.getChatList(sessionId);

      if (response.code === 200) {
        const reversedList = response.data.chat_list.reverse();
        setChatList(reversedList);

        // 각 채팅의 음식 정보 가져오기 (실패해도 채팅 리스트는 표시)
        const foodMap = await buildFoodMap(sessionId, reversedList);
        setFoodItems(foodMap);
      } else {
        setError(response.message);
      }
    } catch (err: unknown) {
      // 404 에러인 경우 채팅 내역 없음 처리 (리스트 정상 표시)
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return;
      }

      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : undefined;
      setError(message || '채팅 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  // 화면이 포커스될 때마다 채팅 리스트 새로고침
  // (useFocusEffect는 마운트 시에도 실행되므로 별도 useEffect 불필요)
  useFocusEffect(
    useCallback(() => {
      if (sessionId) {
        loadChatList();
      }
    }, [sessionId, loadChatList])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadChatList();
  }, [loadChatList]);

  const handleChatPress = useCallback(
    (fcid: string) => {
      router.push(`/chat-detail?fcid=${fcid}`);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatListItem }) => (
      <ChatCard
        item={item}
        foods={foodItems[item.chat_info.fcid] || []}
        onPress={handleChatPress}
      />
    ),
    [foodItems, handleChatPress]
  );

  const keyExtractor = useCallback(
    (item: ChatListItem) => item.chat_info.fcid,
    []
  );

  // --- 로딩 상태 ---
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#f5f5f5]">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-4 text-base text-gray-500">
            채팅 내역을 불러오는 중...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- 에러 상태 ---
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-[#f5f5f5]">
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-base text-red-500 text-center mb-5">
            {error}
          </Text>
          <Button title="다시 시도" onPress={loadChatList} />
        </View>
      </SafeAreaView>
    );
  }

  // --- 정상 렌더링 ---
  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f5]">
      <Header
        title="레시피 추천 내역"
        showBack={true}
        showChat={false}
        showSettings={false}
      />

      <FlatList
        data={chatList}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center py-16">
            <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
            <Text className="text-lg text-gray-500 mt-4 mb-2">
              아직 레시피 추천 내역이 없습니다
            </Text>
            <Text className="text-sm text-gray-400 text-center">
              음식을 선택하고 AI 추천을 받아보세요.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// --- Helper Functions ---

/**
 * 채팅 리스트의 음식 정보를 fcid 기준으로 매핑합니다.
 * 음식 목록 조회에 실패하더라도 빈 맵을 반환하여 채팅 리스트 표시에 영향을 주지 않습니다.
 */
async function buildFoodMap(
  sessionId: string,
  chatList: ChatListItem[]
): Promise<Record<string, FoodItem[]>> {
  try {
    const foodListResponse = await foodAPI.getFoodList(sessionId);
    if (foodListResponse.code !== 200) {
      return createEmptyFoodMap(chatList);
    }

    const foodMap: Record<string, FoodItem[]> = {};
    chatList.forEach((chat) => {
      foodMap[chat.chat_info.fcid] = foodListResponse.data.food_list.filter(
        (food) => chat.food_ids.includes(food.fid)
      );
    });
    return foodMap;
  } catch (err: unknown) {
    console.warn('Failed to get food info:', err);
    return createEmptyFoodMap(chatList);
  }
}

/** 모든 채팅에 대해 빈 음식 배열을 가진 맵을 생성합니다. */
function createEmptyFoodMap(
  chatList: ChatListItem[]
): Record<string, FoodItem[]> {
  const emptyMap: Record<string, FoodItem[]> = {};
  chatList.forEach((chat) => {
    emptyMap[chat.chat_info.fcid] = [];
  });
  return emptyMap;
}
