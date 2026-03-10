import { useAppContext } from '@/contexts/AppContext';
import { foodAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { cssInterop } from 'nativewind';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Header from '@/components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';

// NativeWind가 SafeAreaView의 className을 인식하도록 설정 (warning crash 방지)
cssInterop(SafeAreaView, { className: 'style' });

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

// 날짜 포맷팅 헬퍼
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// 정보 표시 행 컴포넌트
const InfoRow = ({ label, value, isLast = false }: { label: string; value: string | number; isLast?: boolean }) => (
  <View className={`flex-row justify-between py-3 ${!isLast ? 'border-b border-gray-100' : ''}`}>
    <Text className="text-gray-500 font-medium text-base">{label}</Text>
    <Text className="text-gray-900 font-semibold text-base text-right flex-1 ml-4">{value || '-'}</Text>
  </View>
);

export default function FoodDetailScreen() {
  const { sessionId, refreshFoodList } = useAppContext();
  const router = useRouter();
  const { fid } = useLocalSearchParams<{ fid: string }>();
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [loading, setLoading] = useState(true);

  // 식품 정보 조회
  const getFoodInfo = async () => {
    try {
      if (fid && sessionId) {
        const response = await foodAPI.getFoodInfo(sessionId, fid);

        if (response.code === 200) {
          const foodInfo = response.data.food_info;
          setSelectedFood(foodInfo);
        } else {
          Alert.alert('오류', '식품 정보를 불러오지 못했습니다.');
        }
      }
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || '식품 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 식품 삭제
  const deleteFood = async (fid: string) => {
    Alert.alert(
      '식품 삭제',
      '해당 식품을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              if (sessionId) {
                const response = await foodAPI.deleteFood(sessionId, fid);

                if (response.code === 200) {
                  if (refreshFoodList) {
                    await refreshFoodList();
                  }

                  Alert.alert('삭제 완료', '식품이 삭제되었습니다.', [
                    { text: '확인', onPress: () => router.back() }
                  ]);
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

  useEffect(() => {
    if (fid) {
      getFoodInfo();
    }
  }, [fid]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA] justify-center items-center">
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-gray-500 font-medium">불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  if (!selectedFood) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA]">
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        <View className="h-14 flex-row items-center px-4 bg-white border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-gray-500 text-lg mb-4">식품 정보를 찾을 수 없습니다.</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-blue-500 px-6 py-3 rounded-full shadow-sm"
          >
            <Text className="text-white font-semibold">돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F4F6]">
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}
      <Header
        title="식품 상세정보"
        showBack={true}
        showChat={false}
        showSettings={false}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Image Section */}
        <View className="w-3/4 self-center bg-white mb-6 mt-4 relative rounded-2xl overflow-hidden shadow-sm" style={{ aspectRatio: 1 }}>
          {selectedFood.image_url ? (
            <Image
              source={{ uri: selectedFood.image_url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
            />
          ) : (
            <View className="w-full h-full justify-center items-center bg-gray-100">
              <Text className="text-6xl">📦</Text>
              <Text className="text-gray-400 mt-2 font-medium">이미지 없음</Text>
            </View>
          )}

          {/* Badge Example (e.g. Days Remaining) */}
          <View className="absolute bottom-4 right-4 bg-black/70 px-3 py-1.5 rounded-full">
            <Text className="text-white font-bold text-sm">
              {selectedFood.days_remaining > 0
                ? `D-${selectedFood.days_remaining}`
                : selectedFood.days_remaining === 0
                  ? '오늘 만료'
                  : `D+${Math.abs(selectedFood.days_remaining)}`}
            </Text>
          </View>
        </View>

        {/* Content Section */}
        <View className="px-5">
          {/* Header Info */}
          <View className="bg-white p-5 rounded-2xl mb-4">
            <Text className="text-2xl font-bold text-gray-900 mb-2">{selectedFood.name}</Text>
            <Text className="text-gray-600 text-base leading-6">{selectedFood.description}</Text>
            <View className="flex-row mt-3">
              {/* Type Badge */}
              <View className="bg-blue-50 px-3 py-1.5 rounded-md mr-2">
                <Text className="text-blue-600 text-xs font-bold uppercase">{selectedFood.type}</Text>
              </View>
              {/* Volume Badge */}
              <View className="bg-gray-100 px-3 py-1.5 rounded-md">
                <Text className="text-gray-600 text-xs font-bold">{selectedFood.volume}</Text>
              </View>
            </View>
            <InfoRow label="수량" value={`${selectedFood.count}개`} />
            <InfoRow label="원재료명" value={selectedFood.ingredients} />
            <InfoRow label="소비기한 정보" value={selectedFood.expiration_date_desc} />
            <InfoRow label="만료일" value={formatDate(selectedFood.expiration_date)} isLast />
          </View>

          {/* Action Button */}
          <TouchableOpacity
            className="w-full bg-red-50 py-4 rounded-xl border border-red-100 items-center justify-center active:bg-red-100 mb-8 flex-row"
            onPress={() => deleteFood(selectedFood.fid)}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text className="text-red-500 font-bold text-lg">삭제하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
