import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { Colors, GlobalStyles, ScreenStyles, Spacing } from '../styles/GlobalStyles';
// SmileFoodLogo 대신 통일된 아이콘 이미지를 사용합니다

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    title: '스마일푸드에 \n 오신 것을 환영합니다',
    description: '제품을 촬영하고 관리해보세요.',
    image: require('../assets/images/icon.png'),
  },
  {
    title: '간편한 음식 관리',
    description: '바코드를 찍으면 유통기한을 관리해드립니다.',
    image: require('../assets/images/icon.png'),
  },
  {
    title: '건강한 식습관 관리',
    description: '레시피 추천도 받아보세요.',
    image: require('../assets/images/icon.png'),
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * width,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    router.replace('/login');
  };

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {onboardingData.map((item, index) => (
          <View key={index} style={ScreenStyles.onboardingSlide}>
            <View style={ScreenStyles.onboardingContent}>
              <View style={styles.imageContainer}>
                <Image source={item.image} style={ScreenStyles.onboardingImage} />
              </View>
              <View style={styles.textContainer}>
                <Text style={GlobalStyles.title}>{item.title}</Text>
                <Text style={GlobalStyles.description}>{item.description}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 인디케이터 */}
      <View style={styles.indicatorContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              GlobalStyles.indicator,
              index === currentIndex && GlobalStyles.activeIndicator,
            ]}
          />
        ))}
      </View>

      {/* 버튼 */}
      <View style={styles.buttonContainer}>
        {currentIndex < onboardingData.length - 1 ? (
          <TouchableOpacity style={GlobalStyles.primaryButton} onPress={handleNext}>
            <Text style={GlobalStyles.primaryButtonText}>다음</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={GlobalStyles.primaryButton} onPress={handleFinish}>
            <Text style={GlobalStyles.primaryButtonText}>시작하기</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  // 온보딩 특화 스타일만 유지
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    maxWidth: width - 40,
  },
  indicatorContainer: {
    ...GlobalStyles.indicatorContainer,
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xxxxl,
  },
});
