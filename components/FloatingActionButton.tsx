import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';

interface FloatingActionButtonProps {
  onCameraPress: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onCameraPress }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
    }).start();
  };

  const cameraButtonStyle = {
    transform: [
      {
        rotate: animation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '45deg'],
        }),
      },
    ],
  };

  const actionButtonsStyle = {
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -60],
        }),
      },
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
      },
    ],
    opacity: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
  };

  return (
    <View style={styles.container}>
      {/* 추가 액션 버튼들 (향후 확장용) */}
      {isExpanded && (
        <Animated.View style={[styles.actionButtons, actionButtonsStyle]}>
          {/* 예시: 검색 버튼 (향후 추가될 수 있음) */}
          {/* <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
            <Text style={styles.actionButtonIcon}>🔍</Text>
          </TouchableOpacity> */}
          
          {/* 예시: 필터 버튼 (향후 추가될 수 있음) */}
          {/* <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
            <Text style={styles.actionButtonIcon}>⚙️</Text>
          </TouchableOpacity> */}
        </Animated.View>
      )}
      
      {/* 메인 카메라 버튼 */}
      <Animated.View style={[styles.mainButton, cameraButtonStyle]}>
        <TouchableOpacity 
          style={styles.cameraButton} 
          onPress={isExpanded ? toggleExpanded : onCameraPress}
          activeOpacity={0.8}
        >
          <Text style={styles.cameraButtonIcon}>📷</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
  },
  actionButtons: {
    marginBottom: 15,
    alignItems: 'center',
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  mainButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cameraButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButtonIcon: {
    fontSize: 24,
  },
});
