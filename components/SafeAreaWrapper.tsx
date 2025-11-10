import React from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStatusBarHeight } from '../utils/safeArea';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  style?: any;
  backgroundColor?: string;
}

export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({ 
  children, 
  style, 
  backgroundColor = '#fff' 
}) => {
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor }, style]}>
      {/* 안드로이드에서 StatusBar 영역 처리 */}
      {Platform.OS === 'android' && (
        <View 
          style={{ 
            height: getStatusBarHeight(), 
            backgroundColor 
          }} 
        />
      )}
      {children}
    </SafeAreaView>
  );
};
