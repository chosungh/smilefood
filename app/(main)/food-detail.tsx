import { foodAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, DeviceEventEmitter, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '@/contexts/AppContext';
import { FoodDetailStyles as styles } from '@/styles/GlobalStyles';

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
  const DeleteFood = async (fid: string) => {
    Alert.alert(
      '식품 삭제',
      '해당 식품을 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              if (sessionId) {
                const response = await foodAPI.deleteFood(sessionId, fid);

                if (response.code === 200) {
                  // 메인 화면에 즉시 반영하도록 이벤트 전송
                  DeviceEventEmitter.emit('food:deleted', { fid });

                  // 서버 데이터 동기화를 위해 새로고침 호출 (있을 경우)
                  if (refreshFoodList) {
                    await refreshFoodList();
                  }

                  // 상세 화면 닫기
                  router.back();

                  // 안내 표시
                  Alert.alert('삭제 완료', '식품이 삭제되었습니다.');
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <Text>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedFood) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.errorContainer}>
          <Text>식품 정보를 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>식품 상세정보</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 식품 상세정보 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <View style={styles.imageContainer}>
          {selectedFood.image_url ? (
            <Image
              source={{ uri: selectedFood.image_url }}
              style={styles.foodImage}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>📦</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.foodName}>{selectedFood.name}</Text>

          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Text style={styles.infoTitle}>설명</Text>
              <Text style={styles.infoText}>{selectedFood.description}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoTitle}>유형</Text>
              <Text style={styles.infoText}>{selectedFood.type}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoTitle}>수량</Text>
              <Text style={styles.infoText}>{selectedFood.count}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoTitle}>원재료명</Text>
              <Text style={styles.infoText}>{selectedFood.ingredients}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoTitle}>소비기한</Text>
              <Text style={styles.infoText}>{selectedFood.expiration_date_desc}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoTitle}>소비기한 만료 날짜</Text>
              <Text style={styles.infoText}>{selectedFood.expiration_date}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoTitle}>중량</Text>
              <Text style={styles.infoText}>{selectedFood.volume}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => DeleteFood(selectedFood.fid)}
          >
            <Text style={styles.deleteButtonText}>삭제</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

