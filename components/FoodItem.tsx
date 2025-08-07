import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FoodItem } from '../services/api';

interface FoodItemProps {
  food: FoodItem;
  onPress?: () => void;
}

export const FoodItemComponent: React.FC<FoodItemProps> = ({ food, onPress }) => {
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
    const expiration = new Date(expirationDate);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', color: '#FF3B30', text: '소비기한 만료' };
    } else if (diffDays <= 7) {
      return { status: 'warning', color: '#FF9500', text: `${diffDays}일 남음` };
    } else {
      return { status: 'good', color: '#34C759', text: `${diffDays}일 남음` };
    }
  };

  const expirationStatus = getExpirationStatus(food.expiration_date);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        {food.image_url ? (
          <Image source={{ uri: food.image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📦</Text>
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
};

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
