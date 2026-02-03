import { FoodItem } from '@/services/api';
import { Image } from 'expo-image';
import React, { memo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FoodItemProps {
  food: FoodItem;
  onPress?: () => void;
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
    return { status: 'expired', color: '#FF3B30', text: '소비기한 만료' };
  } else if (diffDays <= 3) {
    return { status: 'warning', color: '#FF9500', text: `${diffDays}일 남음` };
  } else if (diffDays <= 7) {
    return { status: 'warning', color: '#FFcc00', text: `${diffDays}일 남음` };
  } else {
    return { status: 'good', color: '#34C759', text: `${diffDays}일 남음` };
  }
};

export const FoodItemComponent: React.FC<FoodItemProps> = memo(({ food, onPress }) => {
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
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {food.image_url && !error ? (
          <Image
            source={{ uri: food.image_url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            onLoadStart={handleLoadStart}
            onLoad={handleLoad}
            onError={handleError}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📦</Text>
          </View>
        )}
        {loading && food.image_url && !error && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{food.name}</Text>
          <View style={[styles.countBadge, { backgroundColor: '#007AFF' }]}>
            <Text style={styles.countText}>{food.count}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={1}>{food.description}</Text>

        <View style={styles.details}>
          <Text style={styles.type}>{food.type}</Text>
          <Text style={styles.volume}>{food.volume}</Text>
        </View>

        <View style={styles.expirationContainer}>
          <View style={[styles.expirationBadge, { backgroundColor: expirationStatus.color }]}>
            <Text style={styles.expirationText}>{expirationStatus.text}</Text>
          </View>
          <Text style={styles.expirationDate}>
            소비기한: {formatDate(food.expiration_date)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
  },
  imageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  details: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  type: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  volume: {
    fontSize: 12,
    color: '#999',
  },
  expirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expirationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expirationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  expirationDate: {
    fontSize: 12,
    color: '#999',
  },
});
