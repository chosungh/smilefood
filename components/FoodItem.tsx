import { FoodItem } from '@/services/api';
import { Image } from 'expo-image';
import React, { memo, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface FoodItemProps {
  food: FoodItem;
  onPress?: () => void;
  onLongPress?: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const getExpirationStatus = (expirationDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 시간 정보를 제거하여 날짜만 비교

  const expiration = new Date(expirationDate);
  expiration.setHours(0, 0, 0, 0);

  const diffTime = expiration.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'expired', color: 'bg-[#FF3B30]', text: '소비기한 만료' };
  } else if (diffDays <= 3) {
    return { status: 'warning', color: 'bg-[#FF9500]', text: `${diffDays}일 남음` };
  } else if (diffDays <= 7) {
    return { status: 'warning', color: 'bg-[#FFcc00]', text: `${diffDays}일 남음` };
  } else {
    return { status: 'good', color: 'bg-[#34C759]', text: `${diffDays}일 남음` };
  }
};

export const FoodItemComponent: React.FC<FoodItemProps> = memo(({ food, onPress, onLongPress }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleLoadStart = () => setLoading(true);
  const handleLoad = () => setLoading(false);
  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const expirationStatus = getExpirationStatus(food.expiration_date);

  return (
    <TouchableOpacity
      className="flex-row bg-white p-4 mb-3"
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View className="relative mr-3">
        {food.image_url && !error ? (
          <Image
            source={{ uri: food.image_url }}
            className="w-20 h-20 rounded-lg"
            style={{ width: 80, height: 80 }}
            contentFit="cover"
            transition={200}
            onLoadStart={handleLoadStart}
            onLoad={handleLoad}
            onError={handleError}
            cachePolicy="memory-disk"
          />
        ) : (
          <View className="w-20 h-20 rounded-lg bg-gray-50 justify-center items-center">
            <Text className="text-3xl">📦</Text>
          </View>
        )}
        {loading && food.image_url && !error && (
          <View className="absolute top-0 left-0 right-0 bottom-0 bg-white/80 justify-center items-center rounded-lg">
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row justify-between items-start mb-1">
          <Text className="text-base font-bold text-gray-800 flex-1 mr-2" numberOfLines={1}>
            {food.name}
          </Text>
          <Text className="text-sm text-gray-500 mb-2" numberOfLines={1}>
            수량: {food.count}개
          </Text>
        </View>

        <Text className="text-sm text-gray-500 mb-2" numberOfLines={1}>
          {food.description}
        </Text>

        <View className="flex-row mb-2">
          <Text className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded mr-2">
            {food.type}
          </Text>
          <Text className="text-xs text-gray-400">{food.volume}</Text>
        </View>

        <View className="flex-row items-center justify-between">
          <View className={`px-2 py-1 rounded-lg ${expirationStatus.color}`}>
            <Text className="text-white text-xs font-bold">{expirationStatus.text}</Text>
          </View>
          <Text className="text-xs text-gray-400">
            소비기한: {formatDate(food.expiration_date)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});
