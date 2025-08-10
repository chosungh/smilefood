import { Platform, StatusBar } from 'react-native';

export const getSafeAreaInsets = () => {
  if (Platform.OS === 'android') {
    // 안드로이드에서는 StatusBar 높이를 고려
    return {
      top: StatusBar.currentHeight || 0,
      bottom: 0,
      left: 0,
      right: 0,
    };
  }
  
  // iOS에서는 SafeAreaView가 자동으로 처리
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };
};

export const getStatusBarHeight = () => {
  if (Platform.OS === 'android') {
    return StatusBar.currentHeight || 0;
  }
  return 0;
};
