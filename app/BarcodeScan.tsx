import { foodAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { useAppContext } from '../contexts/AppContext';
import { BorderRadius, Colors, FontSizes, GlobalStyles, ScreenStyles, Spacing } from '../styles/GlobalStyles';

export default function BarcodeScanScreen() {
  const router = useRouter();
  const { sessionId, refreshFoodList } = useAppContext();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAddedBarcode, setLastAddedBarcode] = useState<string | null>(null);
  const [scanEnabled, setScanEnabled] = useState(false); // 기본적으로 비활성화
  const [scanCount, setScanCount] = useState(0); // 스캔 횟수 추적
  const [hasScanned, setHasScanned] = useState(false); // 스캔 완료 여부 추적
  const cameraRef = useRef<CameraView>(null);
  const scanLockRef = useRef<boolean>(false); // 동기 중복 방지 락
  // 수동 등록 모달 상태
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [manualCount, setManualCount] = useState('1');
  const [manualAdding, setManualAdding] = useState(false);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <SafeAreaWrapper backgroundColor="#FFF">
        {/* 뒤로가기 버튼 */}
        <TouchableOpacity
          style={styles.backArrowButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View style={GlobalStyles.centerContent}>
          <Text style={styles.message}>바코드를 스캔하려면 카메라 권한이 필요합니다.</Text>
          <View style={styles.permissionButtonContainer}>
            <TouchableOpacity style={styles.backToMainButton} onPress={() => router.back()}>
              <Text style={styles.backToMainButtonText} numberOfLines={1}>돌아가기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.grantPermissionButton} onPress={requestPermission}>
              <Text style={styles.buttonText} numberOfLines={1}>계속</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  // 사진 촬영 및 바코드 인식 활성화
  function enableBarcodeScanning() {
    if (isProcessing || scanEnabled) return;
    scanLockRef.current = false;
    setHasScanned(false);
    setScanEnabled(true);
  }

  // 스캔 토글: 스캔 중이면 취소, 아니면 시작
  function handleScanButtonPress() {
    if (isProcessing) return;
    if (scanEnabled) {
      // 스캔 취소
      setScanEnabled(false);
      setHasScanned(false);
      scanLockRef.current = false;
      return;
    }
    enableBarcodeScanning();
  }

  // 바코드 스캔 결과 처리 (자동 호출됨)
  async function onBarcodeScanned(scanningResult: any) {
    // 동기 중복 호출 즉시 차단
    if (scanLockRef.current) {
      console.log('중복 스캔 차단 - scanLockRef');
      return;
    }
    // 이미 스캔했거나, 스캔이 비활성화되었거나, 처리 중이면 무시
    if (hasScanned || !scanEnabled || isProcessing) {
      console.log('스캔 무시됨 - hasScanned:', hasScanned, 'scanEnabled:', scanEnabled, 'isProcessing:', isProcessing);
      return;
    }
    // 첫 유효 호출에서 바로 락 설정
    scanLockRef.current = true;

    const barcodeData = scanningResult.data;

    // 빈 바코드 데이터 체크
    if (!barcodeData || barcodeData.trim() === '') {
      console.log('빈 바코드 데이터 무시');
      return;
    }

    console.log('바코드 인식됨:', barcodeData);

    // 이번 스캔 처리 시작 (한 번 시작당 1개 등록)
    setHasScanned(true);
    setScanEnabled(false);
    setIsProcessing(true);
    setScanCount(prev => prev + 1);
    setLastAddedBarcode(barcodeData);

    try {
      if (!sessionId) {
        Alert.alert('오류', '로그인이 필요합니다.');
        setIsProcessing(false);
        scanLockRef.current = false;
        return;
      }

      const response = await foodAPI.regiFood(sessionId, barcodeData, '1');

      if (response.code === 200) {
        if (refreshFoodList) {
          await refreshFoodList();
        }
        setIsProcessing(false);
        // 다음 스캔을 위해 락 해제 (사용자가 스캔 시작을 다시 눌러야 함)
        scanLockRef.current = false;
      } else {
        Alert.alert('오류', response.message, [
          { text: '확인', onPress: () => { setIsProcessing(false); scanLockRef.current = false; } }
        ]);
      }
    } catch (error: any) {
      console.warn('바코드 스캔 오류:', error);
      let errorMessage = '식품 추가에 실패했습니다.';
      const status = error?.response?.status;
      const serverMessage = error?.response?.data?.message;
      if (status === 401) errorMessage = '세션이 만료되었습니다. 다시 로그인하세요.';
      else if (status === 404) errorMessage = '바코드 정보를 찾을 수 없습니다.';
      else if (serverMessage) errorMessage = serverMessage;
      Alert.alert('오류', errorMessage, [
        { text: '확인', onPress: () => { setIsProcessing(false); scanLockRef.current = false; } }
      ]);
    }
  }


  return (
    <SafeAreaWrapper backgroundColor="#000">
      {/* 뒤로가기 버튼 */}
      <TouchableOpacity
        style={styles.backArrowButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={ScreenStyles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={ScreenStyles.camera}
          facing={facing}
          barcodeScannerSettings={
            hasScanned || scanLockRef.current
              ? undefined // 스캔 완료 시 바코드 스캔 기능 완전 비활성화
              : { barcodeTypes: ['code128', 'ean13', 'ean8'] }
          }
          onBarcodeScanned={hasScanned || scanLockRef.current ? undefined : onBarcodeScanned}
        />

        {/* 스캔 가이드라인 오버레이 */}
        <View style={ScreenStyles.scanOverlay}>
          <View style={ScreenStyles.scanArea}>
          </View>

          {/* 로딩 인디케이터 */}
          {isProcessing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00FF00" />
            </View>
          )}

          <Text style={ScreenStyles.instructionText}>
            {scanEnabled ? '바코드를 카메라 중앙에 맞춰주세요...' : '스캔을 시작하려면 버튼을 눌러주세요.'}
          </Text>

          {lastAddedBarcode && (
            <Text style={styles.lastBarcodeText}>
              마지막 추가: {lastAddedBarcode}
            </Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>뒤로가기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              scanEnabled ? styles.scanningButton : styles.captureButton,
              isProcessing && styles.processingButton
            ]}
            onPress={handleScanButtonPress}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>
              {isProcessing ? '처리 중...' : scanEnabled ? '스캔 중...' : '스캔 시작'}
            </Text>
          </TouchableOpacity>

        </View>
        {/* 하이퍼링크: 바코드 수동 등록 (상단 플로팅 버튼) */}
        <TouchableOpacity
          onPress={() => setManualModalVisible(true)}
          disabled={isProcessing}
          style={styles.manualLinkContainer}
          activeOpacity={0.8}
        >
          <Text style={styles.manualLinkText}>수동 등록</Text>
        </TouchableOpacity>

        {/* 수동 등록 모달 */}
        <Modal
          visible={manualModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setManualModalVisible(false)}
        >
          <View style={styles.modalShade}>
            <View style={styles.manualModalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setManualModalVisible(false)}>
                  <Ionicons name='arrow-back' size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>식품 수동 등록</Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="식품 바코드 번호"
                placeholderTextColor="#999"
                value={manualBarcode}
                onChangeText={setManualBarcode}
                keyboardType="number-pad"
                onSubmitEditing={() => Keyboard.dismiss()}
                blurOnSubmit={true}
                returnKeyType="done"
              />

              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>식품 수량</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => {
                      const current = parseInt(manualCount) || 1;
                      if (current > 1) setManualCount(String(current - 1));
                    }}
                    disabled={manualAdding}
                  >
                    <Ionicons name="remove" size={20} color="#007aff" />
                  </TouchableOpacity>
                  <Text style={styles.quantityValue}>{manualCount}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => {
                      const current = parseInt(manualCount) || 1;
                      if (current < 999) setManualCount(String(current + 1));
                    }}
                    disabled={manualAdding}
                  >
                    <Ionicons name="add" size={20} color="#007aff" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalPrimaryButton, manualAdding && styles.modalPrimaryButtonDisabled]}
                onPress={async () => {
                  if (!sessionId || manualBarcode.trim() === '') {
                    Alert.alert('알림', '바코드를 입력해주세요.');
                    return;
                  }
                  const count = parseInt(manualCount);
                  if (!count || count < 1 || count > 999) {
                    Alert.alert('알림', '식품 수량을 1~999 사이로 입력해주세요.');
                    return;
                  }
                  try {
                    setManualAdding(true);
                    const response = await foodAPI.regiFood(sessionId, manualBarcode.trim(), manualCount);
                    if (response.code === 200) {
                      Alert.alert('식품 추가 완료', response.message, [{ text: '확인' }]);
                      setManualBarcode('');
                      setManualCount('1');
                      setManualModalVisible(false);
                      if (refreshFoodList) {
                        refreshFoodList();
                      }
                    } else {
                      Alert.alert('오류', response.message || '식품 추가에 실패했습니다.');
                    }
                  } catch (error: any) {
                    Alert.alert('오류', error?.response?.data?.message || '식품 추가에 실패했습니다.');
                  } finally {
                    setManualAdding(false);
                  }
                }}
                disabled={manualAdding}
              >
                <Text style={[styles.modalPrimaryButtonText, manualAdding && styles.modalPrimaryButtonTextDisabled]}>
                  {manualAdding ? '추가 중...' : '식품 추가'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  // 권한 요청 메시지
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },

  // 스캔 코너 위치 조정
  topRight: {
    top: -2,
    right: -2,
    left: 'auto',
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    top: 'auto',
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 4,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    top: 'auto',
    left: 'auto',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },

  // 버튼 컨테이너 및 버튼들
  buttonContainer: {
    position: 'absolute',
    bottom: 48,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    width: '100%',
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgb(100, 100, 100)',
    paddingVertical: 15,
    borderRadius: BorderRadius.xxl,
  },
  backButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgb(100, 100, 100)',
    paddingVertical: 15,
    borderRadius: BorderRadius.xxl,
  },
  permissionButtonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 15,
    justifyContent: 'center',
  },
  grantPermissionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.xxl,
    flex: 1,
    minWidth: 100,
    maxWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToMainButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: '#007AFF',
    flex: 1,
    minWidth: 100,
    maxWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToMainButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  backArrowButton: {
    backgroundColor: 'rgba(100, 100, 100, 0.5)',
    borderRadius: 100,
    position: 'absolute',
    top: 65,
    left: 20,
    zIndex: 1000,
    padding: 8,
  },
  captureButton: {
    backgroundColor: '#007AFF',
  },
  scanningButton: {
    backgroundColor: 'rgb(255, 100, 0)',
  },
  processingButton: {
    backgroundColor: 'rgb(100, 100, 100)',
  },
  buttonText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
  },

  // 로딩 및 정보 표시
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: BorderRadius.xxl,
  },
  scanCountText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    overflow: 'hidden',
  },
  lastBarcodeText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: '400',
    marginTop: 10,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    overflow: 'hidden',
  },
  manualLinkContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(100, 100, 100, 0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  manualLinkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalShade: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingTop: 100,
    paddingBottom: 80,
    paddingLeft: 40,
    paddingRight: 40,
  },
  manualModalContent: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: '80%',
  },
  modalHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    padding: 20,
    zIndex: 20,
    borderRadius: 16,
  },
  modalTitleContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
    paddingLeft: 20,
    paddingRight: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 20,
    color: '#333',
    minHeight: 50,
  },
  quantityContainer: {
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#007aff',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 60,
    textAlign: 'center',
  },
  modalPrimaryButton: {
    backgroundColor: '#007aff',
    width: '100%',
    borderRadius: 12,
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 20,
    paddingRight: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop: 20,
  },
  modalPrimaryButtonDisabled: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0.05,
    elevation: 2,
  },
  modalPrimaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalPrimaryButtonTextDisabled: {
    color: '#999999',
  },
});
