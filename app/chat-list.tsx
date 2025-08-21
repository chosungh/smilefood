import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import { ChatInfo, foodAPI, FoodItem } from '../services/api';

type ChatListItem = {
  chat_info: ChatInfo;
  food_ids: string[];
};

export default function ChatListScreen() {
  const router = useRouter();
  const { sessionId } = useAppContext();
  
  const [chatList, setChatList] = useState<ChatListItem[]>([]);
  const [foodItems, setFoodItems] = useState<{ [key: string]: FoodItem[] }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChatList = async () => {
    if (!sessionId) return;

    try {
      setError(null);
      const response = await foodAPI.getChatList(sessionId);
      
      if (response.code === 200) {
        setChatList(response.data.chat_list.reverse());
        
        // 각 채팅의 음식 정보 가져오기 (404 에러 처리 포함)
        try {
          const foodListResponse = await foodAPI.getFoodList(sessionId);
          if (foodListResponse.code === 200) {
            const foodMap: { [key: string]: FoodItem[] } = {};
            
            response.data.chat_list.forEach(chat => {
              // 존재하는 음식만 필터링
              const selectedFoods = foodListResponse.data.food_list.filter(
                food => chat.food_ids.includes(food.fid) && food.is_active === 1
              );
              foodMap[chat.chat_info.fcid] = selectedFoods;
            });
            
            setFoodItems(foodMap);
          }
        } catch (foodError: any) {
          // 음식 정보 가져오기 실패 시에도 채팅 리스트는 표시
          console.warn('Failed to get food info:', foodError);
          
          // 빈 음식 맵으로 설정하여 채팅 리스트는 정상 표시
          const emptyFoodMap: { [key: string]: FoodItem[] } = {};
          response.data.chat_list.forEach(chat => {
            emptyFoodMap[chat.chat_info.fcid] = [];
          });
          setFoodItems(emptyFoodMap);
        }
      } else {
        setError(response.message);
      }
    } catch (error: any) {
      // console.error('Error loading chat list:', error);
      
      // 404 에러인 경우 채팅 내역 없음 처리(리스트 정상 표시)
      if (error.response?.status === 404) {
        return
      }

      setError(error.response?.data?.message || '채팅 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadChatList();
  }, [sessionId]);

  // 화면이 포커스될 때마다 채팅 리스트 새로고침
  useFocusEffect(
    useCallback(() => {
      if (sessionId) {
        loadChatList();
      }
    }, [sessionId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadChatList();
  };

  const handleChatPress = (fcid: string) => {
    router.push(`/chat-detail?fcid=${fcid}`);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'created':
        return '생성됨';
      case 'queued':
        return '대기중';
      case 'creating':
        return '생성중';
      case 'completed':
        return '완료';
      case 'failed':
        return '실패';
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
      case 'queued':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const renderChatCard = ({ item }: { item: ChatListItem }) => {
    const foods = foodItems[item.chat_info.fcid] || [];
    const hasResponse = item.chat_info.response && item.chat_info.response.length > 0;
    
    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => handleChatPress(item.chat_info.fcid)}
        activeOpacity={0.7}
      >
        {/* 상태 및 날짜 헤더 */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.chat_info.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.chat_info.status)}</Text>
          </View>
          <Text style={styles.dateText}>{new Date(item.chat_info.created_at).toLocaleString('ko-KR')}</Text>
        </View>

        {/* 음식 정보 */}
        {foods.length > 0 ? (
          <View style={styles.foodSection}>
            <Text style={styles.foodSectionTitle}>사용된 식품</Text>
            <View style={styles.foodList}>
              {foods.slice(0, 3).map((food, index) => (
                <View key={food.fid} style={styles.foodItem}>
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
                  <Text style={styles.foodName} numberOfLines={1}>
                    {food.name}
                  </Text>
                </View>
              ))}
              {foods.length > 3 && (
                <View style={styles.moreFoods}>
                  <Text style={styles.moreFoodsText}>+{foods.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.foodSection}>
            <Text style={styles.foodSectionTitle}>사용된 식품</Text>
            <View style={styles.noFoodContainer}>
              <Ionicons name="information-circle-outline" size={20} color="#999" />
              <Text style={styles.noFoodText}>음식 정보를 불러올 수 없습니다</Text>
            </View>
          </View>
        )}

        {/* 레시피 미리보기 */}
        {hasResponse && (
          <View style={styles.recipePreview}>
            <Text style={styles.recipePreviewText} numberOfLines={3}>
              {item.chat_info.response}
            </Text>
          </View>
        )}

        {/* 화살표 아이콘 */}
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>채팅 내역을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadChatList}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>레시피 추천 내역</Text>
      </View>
      
      <FlatList
        data={chatList}
        renderItem={renderChatCard}
        keyExtractor={(item) => item.chat_info.fcid}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>아직 레시피 추천 내역이 없습니다</Text>
            <Text style={styles.emptySubText}>
              음식을 선택하고 AI 추천을 받아보세요.
            </Text>
          </View>
        }
      />
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
  listContainer: {
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
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  chatCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  foodSection: {
    marginBottom: 16,
  },
  foodSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  foodList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodItem: {
    alignItems: 'center',
    marginRight: 12,
    width: 60,
  },
  foodImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: 4,
  },
  foodPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  foodPlaceholderText: {
    fontSize: 20,
  },
  foodName: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  moreFoods: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  moreFoodsText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  recipePreview: {
    marginBottom: 16,
  },
  recipePreviewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  usageInfo: {
    marginBottom: 8,
  },
  usageText: {
    fontSize: 12,
    color: '#999',
  },
  arrowContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  noFoodContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  noFoodText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
