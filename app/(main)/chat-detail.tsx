import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '@/contexts/AppContext';
import { ChatInfo, foodAPI, FoodItem } from '@/services/api';

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
      Alert.alert('오류', '필수 정보가 누락되었습니다.');
      router.back();
      return;
    }

    const pollChatStatus = async () => {
      try {
        const response = await foodAPI.getFoodChatStatus(sessionId, fcid);
        
        if (response.code === 200) {
          setChatInfo(response.data.chat_info);
          
          // 음식 정보 가져오기
          if (response.data.food_ids.length > 0) {
            const foodListResponse = await foodAPI.getFoodList(sessionId);
            if (foodListResponse.code === 200) {
              const selectedFoods = foodListResponse.data.food_list.filter(
                food => response.data.food_ids.includes(food.fid)
              );
              setFoodItems(selectedFoods);
            }
          }

          // 상태가 completed나 failed가 아니면 1초 후 다시 폴링
          if (response.data.chat_info.status !== 'completed' && response.data.chat_info.status !== 'failed') {
            setTimeout(pollChatStatus, 1000);
          } else {
            setLoading(false);
          }
        } else {
          setError(response.message);
          setLoading(false);
        }
      } catch (error: any) {
        setError('채팅 상태를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    pollChatStatus();
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
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      case 'creating':
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            {chatInfo ? getStatusText(chatInfo.status) : '레시피를 생성하고 있습니다...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>레시피 상세</Text>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 상태 표시 */}
        {chatInfo && (
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(chatInfo.status) }]}>
              <Text style={styles.statusText}>{getStatusText(chatInfo.status)}</Text>
            </View>
            <Text style={styles.timestamp}>
              {new Date(chatInfo.created_at).toLocaleString('ko-KR')}
            </Text>
          </View>
        )}

        {/* 선택된 음식들 */}
        {foodItems.length > 0 && (
          <View style={styles.foodSection}>
            <Text style={styles.sectionTitle}>사용된 식품</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.foodScroll}>
              {foodItems.map((food) => (
                <View key={food.fid} style={styles.foodCard}>
                  {food.image_url ? (
                    <Image
                      source={{ uri: food.image_url }}
                      style={styles.foodImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.foodPlaceholder}>
                      <Text style={styles.foodPlaceholderText}>📦</Text>
                    </View>
                  )}
                  <Text style={styles.foodName} numberOfLines={2}>
                    {food.name}
                  </Text>
                  <Text style={styles.foodCount}>수량: {food.count}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 레시피 추천 결과 */}
        {chatInfo?.response && (
          <View style={styles.recipeSection}>
            <Text style={styles.sectionTitle}>레시피 추천</Text>
            <View style={styles.recipeCard}>
              <Text style={styles.recipeText}>{chatInfo.response}</Text>
            </View>
          </View>
        )}

        {/* 사용량 정보 */}
        {chatInfo && (
          <View style={styles.usageSection}>
            <Text style={styles.sectionTitle}>사용량 정보</Text>
            <View style={styles.usageCard}>
              <Text style={styles.usageText}>
                입력 토큰: {chatInfo.usage_input_token}
              </Text>
              <Text style={styles.usageText}>
                출력 토큰: {chatInfo.usage_output_token}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  foodSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  foodScroll: {
    flexGrow: 0,
  },
  foodCard: {
    width: 120,
    marginRight: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  foodPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodPlaceholderText: {
    fontSize: 32,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
    color: '#333',
  },
  foodCount: {
    fontSize: 12,
    color: '#666',
  },
  recipeSection: {
    marginBottom: 24,
  },
  recipeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  usageSection: {
    marginBottom: 24,
  },
  usageCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  usageText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});
