import Button from '@/components/Button';
import Header from '@/components/Header';
import { useAppContext } from '@/contexts/AppContext';
import { ChatInfo, foodAPI, FoodItem } from '@/services/api';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { cssInterop } from 'nativewind';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// NativeWind가 SafeAreaView의 className을 인식하도록 설정
cssInterop(SafeAreaView, { className: 'style' });

export default function ChatDetailScreen() {
  const { sessionId } = useAppContext();
  const router = useRouter();
  const { fcid } = useLocalSearchParams<{ fcid: string }>();

  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !fcid) {
      Alert.alert('오류', '필수 정보가 누락되었습니다.', [
        { text: '확인', onPress: () => router.back() }
      ]);
      return;
    }

    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;
    const appState = React.useRef(AppState.currentState);
    const chatStatusRef = React.useRef<string>('creating'); // Track status to know if we should resume

    const pollChatStatus = async () => {
      // If unmounted or backgrounded, stop polling
      if (!isMounted || appState.current.match(/inactive|background/)) return;

      try {
        const response = await foodAPI.getFoodChatStatus(sessionId, fcid);
        if (!isMounted) return;

        if (response.code === 200) {
          const status = response.data.chat_info.status;
          setChatInfo(response.data.chat_info);
          chatStatusRef.current = status;

          // 상태가 completed일 때만 음식 정보를 가져옴 (불필요한 반복 호출 방지)
          if (status === 'completed' && response.data.food_ids.length > 0) {
            const foodListResponse = await foodAPI.getFoodList(sessionId);
            if (isMounted && foodListResponse.code === 200) {
              const selectedFoods = foodListResponse.data.food_list.filter(
                food => response.data.food_ids.includes(food.fid)
              );
              setFoodItems(selectedFoods);
            }
          }

          // 상태가 completed나 failed가 아니면 1초 후 다시 폴링
          if (status !== 'completed' && status !== 'failed') {
            timeoutId = setTimeout(pollChatStatus, 1000);
          } else {
            if (isMounted) setLoading(false);
          }
        } else {
          if (isMounted) {
            setError(response.message);
            setLoading(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('채팅 상태를 불러오는 중 오류가 발생했습니다.');
          setLoading(false);
        }
      }
    };

    // Initial polling
    pollChatStatus();

    // AppState Listener
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
      if (nextAppState === 'active') {
        // Resume polling if we come back to foreground and not finished
        if (chatStatusRef.current !== 'completed' && chatStatusRef.current !== 'failed') {
          // Cancel previous timeout just in case (though it should have stopped)
          if (timeoutId) clearTimeout(timeoutId);
          pollChatStatus();
        }
      }
    });

    // cleanup: 언마운트 시 타이머 정리 및 state 업데이트 방지
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.remove();
    };
  }, [sessionId, fcid]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'created':
        return '대화 세션이 생성되었습니다';
      case 'queued':
        return '대기열에 들어갔습니다';
      case 'creating':
        return '레시피를 생성하고 있습니다...';
      case 'completed':
        return '레시피 생성이 완료되었습니다';
      case 'failed':
        return '레시피 생성에 실패했습니다';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'creating':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
  };

  // 로딩 화면
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#f5f5f5]">
        <Header
          title="레시피 상세"
          showBack={true}
          showChat={false}
          showSettings={false}
        />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-4 text-base text-gray-500">
            {chatInfo ? getStatusText(chatInfo.status) : '레시피를 생성하고 있습니다...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 에러 화면
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-[#f5f5f5]">
        <Header
          title="레시피 상세"
          showBack={true}
          showChat={false}
          showSettings={false}
        />
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-base text-red-500 text-center mb-5">{error}</Text>
          <Button title="다시 시도" onPress={handleRetry} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f5]">
      {/* Header 컴포넌트 적용 */}

      <Header
        title="레시피 상세"
        showBack={true}
        showChat={false}
        showSettings={false}
      />

      <ScrollView
        className="flex-1 p-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* 상태 표시 */}
        {chatInfo && (
          <View className="items-center mb-6">
            <View className={`px-4 py-2 rounded-full mb-2 ${getStatusColor(chatInfo.status)}`}>
              <Text className="text-white text-sm font-semibold">
                {getStatusText(chatInfo.status)}
              </Text>
            </View>
            <Text className="text-xs text-gray-500">
              {new Date(chatInfo.created_at).toLocaleString('ko-KR')}
            </Text>
          </View>
        )}

        {/* 선택된 음식들 */}
        {foodItems.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-3 text-gray-700">사용된 식품</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              {foodItems.map((food) => (
                <View
                  key={food.fid}
                  className="w-[120px] mr-3 bg-white rounded-xl p-3 items-center shadow-sm"
                >
                  {food.image_url ? (
                    <Image
                      source={{ uri: food.image_url }}
                      style={{ width: 80, height: 80, borderRadius: 8, marginBottom: 8 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-20 h-20 rounded-lg bg-gray-100 justify-center items-center mb-2">
                      <Text className="text-3xl">📦</Text>
                    </View>
                  )}
                  <Text className="text-sm font-medium text-center mb-1 text-gray-700" numberOfLines={2}>
                    {food.name}
                  </Text>
                  <Text className="text-xs text-gray-500">수량: {food.count}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 레시피 추천 결과 */}
        {chatInfo?.response && (
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-3 text-gray-700">레시피 추천</Text>
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <Text className="text-base leading-6 text-gray-700">
                {chatInfo.response}
              </Text>
            </View>
          </View>
        )}

        {/* 사용량 정보 */}
        {chatInfo && (
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-3 text-gray-700">사용량 정보</Text>
            <View className="bg-white rounded-xl p-4">
              <Text className="text-sm text-gray-500 mb-1">
                입력 토큰: {chatInfo.usage_input_token}
              </Text>
              <Text className="text-sm text-gray-500">
                출력 토큰: {chatInfo.usage_output_token}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
