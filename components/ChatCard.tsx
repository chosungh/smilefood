import { ChatInfo, FoodItem } from '@/services/api';
import { formatDateKR } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type ChatListItem = {
    chat_info: ChatInfo;
    food_ids: string[];
};

interface ChatCardProps {
    item: ChatListItem;
    foods: FoodItem[];
    onPress: (fcid: string) => void;
}

/** 상태에 따른 한글 텍스트 */
const STATUS_TEXT_MAP: Record<string, string> = {
    created: '생성됨',
    queued: '대기중',
    creating: '생성중',
    completed: '완료',
    failed: '실패',
};

/** 상태에 따른 배지 배경색 (Tailwind 클래스) */
const STATUS_COLOR_MAP: Record<string, string> = {
    completed: 'bg-green-500',
    failed: 'bg-red-500',
    creating: 'bg-orange-500',
    queued: 'bg-blue-500',
};

function ChatCard({ item, foods, onPress }: ChatCardProps) {
    const hasResponse = item.chat_info.response && item.chat_info.response.length > 0;
    const statusText = STATUS_TEXT_MAP[item.chat_info.status] ?? item.chat_info.status;
    const statusColorClass = STATUS_COLOR_MAP[item.chat_info.status] ?? 'bg-gray-400';

    return (
        <TouchableOpacity
            className="bg-white rounded-2xl p-4 mb-4"
            style={{ elevation: 4 }}
            onPress={() => onPress(item.chat_info.fcid)}
            activeOpacity={0.7}
        >
            {/* 상태 및 날짜 헤더 */}
            <View className="flex-row justify-between items-center mb-4">
                <View className={`px-3 py-1.5 rounded-full ${statusColorClass}`}>
                    <Text className="text-white text-xs font-semibold">{statusText}</Text>
                </View>
                <Text className="text-xs text-gray-500">
                    {formatDateKR(item.chat_info.created_at)}
                </Text>
            </View>

            {/* 음식 정보 */}
            <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">사용된 식품</Text>
                {foods.length > 0 ? (
                    <View className="flex-row items-center">
                        {foods.slice(0, 3).map((food) => (
                            <View key={food.fid} className="items-center mr-3 w-[60px]">
                                {food.image_url ? (
                                    <Image
                                        source={{ uri: food.image_url }}
                                        style={{ width: 50, height: 50, borderRadius: 8, marginBottom: 4 }}
                                        contentFit="cover"
                                    />
                                ) : (
                                    <View className="w-[50px] h-[50px] rounded-lg bg-gray-100 justify-center items-center mb-1">
                                        <Text className="text-xl">📦</Text>
                                    </View>
                                )}
                                <Text className="text-[10px] text-gray-500 text-center" numberOfLines={1}>
                                    {food.name}
                                </Text>
                            </View>
                        ))}
                        {foods.length > 3 && (
                            <View className="w-[50px] h-[50px] rounded-lg bg-gray-100 justify-center items-center mb-1">
                                <Text className="text-xs text-gray-500 font-medium">
                                    +{foods.length - 3}
                                </Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <View className="items-center py-2.5">
                        <Ionicons name="information-circle-outline" size={20} color="#999" />
                        <Text className="text-sm text-gray-400 italic">
                            음식 정보를 불러올 수 없습니다
                        </Text>
                    </View>
                )}
            </View>

            {/* 레시피 미리보기 */}
            {hasResponse && (
                <View className="mb-4">
                    <Text className="text-sm text-gray-700 leading-5" numberOfLines={3}>
                        {item.chat_info.response}
                    </Text>
                </View>
            )}

            {/* 화살표 아이콘 */}
            <View className="absolute right-4 top-1/2 -translate-y-2.5">
                <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
        </TouchableOpacity>
    );
}

export default memo(ChatCard);
