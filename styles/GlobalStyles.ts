import { StyleSheet, Dimensions } from 'react-native';
import { getStatusBarHeight } from 'react-native-status-bar-height';

const { width, height } = Dimensions.get('window');
const statusbarHeight = getStatusBarHeight();
const isSmallScreen = height < 700;

// 공통 색상 팔레트
export const Colors = {
  primary: '#007AFF',
  secondary: '#34C759',
  background: '#f8f9fa',
  white: '#fff',
  black: '#000',
  text: {
    primary: '#333',
    secondary: '#666',
    tertiary: '#999',
    placeholder: '#ccc',
  },
  border: {
    light: '#f0f0f0',
    medium: '#ddd',
    dark: '#e9ecef',
  },
  error: '#ff3b30',
  success: '#34C759',
  warning: '#FF9500',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

// 공통 크기 및 간격
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

// 공통 폰트 크기
export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 22,
  xxxl: 24,
  xxxxl: 28,
  xxxxxl: 32,
};

// 공통 border radius
export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 50,
};

// 글로벌 스타일시트
export const GlobalStyles = StyleSheet.create({
  // === 컨테이너 스타일 ===
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  containerWhite: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: statusbarHeight,
  },

  // === 헤더 스타일 ===
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: statusbarHeight,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 15,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.dark,
  },

  headerTitle: {
    fontSize: isSmallScreen ? FontSizes.xl : FontSizes.xxxl,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },

  headerTitleCenter: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },

  backButton: {
    fontSize: FontSizes.xxxl,
    color: Colors.primary,
    fontWeight: 'bold',
  },

  // === 카드 스타일 ===
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  cardWithMargin: {
    backgroundColor: Colors.white,
    margin: Spacing.xl,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // === 버튼 스타일 ===
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: isSmallScreen ? 14 : Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  primaryButtonText: {
    color: Colors.white,
    fontSize: isSmallScreen ? Spacing.lg : FontSizes.lg,
    fontWeight: '600',
  },

  secondaryButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: isSmallScreen ? 14 : Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: Colors.white,
    fontSize: isSmallScreen ? Spacing.lg : FontSizes.lg,
    fontWeight: '600',
  },

  disabledButton: {
    backgroundColor: Colors.text.placeholder,
  },

  smallButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },

  smallButtonText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  // === 텍스트 스타일 ===
  title: {
    fontSize: isSmallScreen ? FontSizes.xl : FontSizes.xxxl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: isSmallScreen ? Spacing.md : Spacing.lg,
    color: Colors.text.primary,
    lineHeight: isSmallScreen ? 26 : 32,
  },

  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  description: {
    fontSize: isSmallScreen ? FontSizes.sm : FontSizes.md,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 20 : 24,
    color: Colors.text.secondary,
  },

  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },

  // === 입력 필드 스타일 ===
  inputContainer: {
    marginBottom: Spacing.xl,
  },

  label: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },

  input: {
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
    backgroundColor: '#f9f9f9',
  },

  // === 리스트 스타일 ===
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },

  listItemText: {
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },

  listItemArrow: {
    fontSize: FontSizes.md,
    color: Colors.text.placeholder,
  },

  // === 이미지 스타일 ===
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },

  avatarText: {
    color: Colors.white,
    fontSize: FontSizes.xxxl,
    fontWeight: 'bold',
  },

  placeholderImage: {
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },

  // === 로딩 및 오버레이 ===
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: Spacing.lg,
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
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
    borderRadius: BorderRadius.sm,
  },

  // === 모달 스타일 ===
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingTop: 100,
    paddingBottom: 80,
    paddingLeft: Spacing.xxxxl,
    paddingRight: Spacing.xxxxl,
  },

  modalContainer: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    borderRadius: BorderRadius.xl,
    width: '100%',
    height: '100%',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: '80%',
  },

  // === 인디케이터 스타일 ===
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },

  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border.medium,
    marginHorizontal: 4,
  },

  activeIndicator: {
    backgroundColor: Colors.primary,
    width: 24,
  },

  // === 센터 정렬 ===
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // === 행 정렬 ===
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // === 그림자 효과 ===
  shadow: {
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // === 반응형 스타일 ===
  responsivePadding: {
    paddingHorizontal: isSmallScreen ? Spacing.lg : Spacing.xl,
  },

  responsiveMargin: {
    marginHorizontal: isSmallScreen ? Spacing.lg : Spacing.xl,
  },
});

// 화면별 특화 스타일
export const ScreenStyles = StyleSheet.create({
  // === 온보딩 스타일 ===
  onboardingSlide: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  onboardingContent: {
    flex: 1,
    width: '100%',
    paddingTop: isSmallScreen ? 60 : 80,
    paddingBottom: 200,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  onboardingImage: {
    width: isSmallScreen ? width * 0.5 : width * 0.6,
    height: isSmallScreen ? width * 0.5 : width * 0.6,
    resizeMode: 'contain',
  },

  // === 메인 화면 스타일 ===
  foodListView: {
    height: height / 10,
    width: '100%',
    flexDirection: 'row',
    padding: 10,
    backgroundColor: Colors.white,
    borderBottomColor: Colors.background,
    borderBottomWidth: 1,
  },

  foodListImage: {
    width: (height / 10) - 20,
    aspectRatio: 1,
    borderRadius: BorderRadius.sm,
  },

  foodListTitle: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },

  foodListContent: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },

  // === 바코드 스캔 스타일 ===
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  camera: {
    flex: 1,
  },

  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 2,
    borderRadius: BorderRadius.xl,
  },

  scanCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#00FF00',
    borderWidth: 4,
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderRadius: 10,
  },

  instructionText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginTop: 30,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: 10,
  },

  // === 채팅 스타일 ===
  chatCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },

  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },

  chatContent: {
    padding: Spacing.lg,
  },

  chatText: {
    fontSize: FontSizes.sm,
    color: Colors.text.primary,
    lineHeight: 20,
  },
});

export default GlobalStyles;
