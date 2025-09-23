import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { foodAPI } from '@/services/api';
import { useAppContext } from '../contexts/AppContext';
import { GlobalStyles, Colors, Spacing, FontSizes, BorderRadius, ScreenStyles } from '../styles/GlobalStyles';

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

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={GlobalStyles.centerContent}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  // 사진 촬영 및 바코드 인식 활성화
  function enableBarcodeScanning() {
    if (isProcessing) return;
    
    // 스캔 활성화 (이제 바코드가 인식되면 자동으로 처리됨)
    setScanEnabled(true);
    Alert.alert(
      '바코드 스캔 활성화', 
      '바코드를 카메라 중앙에 맞춰주세요. 자동으로 인식됩니다.',
      [{ text: '확인' }]
    );
  }

  // 바코드 스캔 결과 처리 (자동 호출됨)
  async function onBarcodeScanned(scanningResult: any) {
    // 이미 스캔했거나, 스캔이 비활성화되었거나, 처리 중이면 무시
    if (hasScanned || !scanEnabled || isProcessing || scanCount > 0) {
      console.log('스캔 무시됨 - hasScanned:', hasScanned, 'scanEnabled:', scanEnabled, 'isProcessing:', isProcessing, 'scanCount:', scanCount);
      return;
    }
    
    const barcodeData = scanningResult.data;
    
    // 빈 바코드 데이터 체크
    if (!barcodeData || barcodeData.trim() === '') {
      console.log('빈 바코드 데이터 무시');
      return;
    }
    
    console.log('바코드 인식됨:', barcodeData);
    
    // 즉시 모든 스캔 관련 상태 비활성화 (추가 스캔 완전 차단)
    setHasScanned(true);
    setScanEnabled(false);
    setIsProcessing(true);
    setScanCount(1); // 정확히 1로 설정
    setLastAddedBarcode(barcodeData);
    
    try {
      if (!sessionId) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      // 바코드로 식품 추가 (수량 1개 고정)
      const response = await foodAPI.regiFood(sessionId, barcodeData, '1');
      
      if (response.code === 200) {
        // 성공 시 자동으로 메인 화면으로 돌아가기
        setTimeout(() => {
          // 메인 화면의 식품 리스트 새로고침
          if (refreshFoodList) {
            refreshFoodList();
          }
          // 메인 화면으로 돌아가기
          router.back();
        }, 1500); // 1.5초 후 자동으로 돌아가기
        
        Alert.alert(
          '식품 추가 완료', 
          `${response.message}\n\n바코드: ${barcodeData}\n\n1.5초 후 자동으로 메인 화면으로 돌아갑니다.`,
          [
            {
              text: '지금 돌아가기',
              onPress: () => {
                // 메인 화면의 식품 리스트 새로고침
                if (refreshFoodList) {
                  refreshFoodList();
                }
                // 메인 화면으로 돌아가기
                router.back();
              }
            }
          ]
        );
      } else {
        Alert.alert('오류', response.message, [
          {
            text: '확인',
            onPress: () => {
              // 실패 시 스캔 비활성화 상태 유지 (사용자가 버튼을 다시 눌러야 함)
              setScanEnabled(false);
              setIsProcessing(false);
            }
          }
        ]);
      }
    } catch (error: any) {
      console.error('바코드 스캔 오류:', error);
      
      let errorMessage = '식품 추가에 실패했습니다.';
      let isConflictError = false;
      
      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.message;
        
        if (status === 409) {
          // 중복 등록 오류
          isConflictError = true;
          errorMessage = serverMessage || '이미 등록된 식품입니다. 수량을 늘리시겠습니까?';
        } else if (status === 401) {
          errorMessage = '세션이 만료되었습니다. 다시 로그인하세요.';
        } else if (status === 404) {
          errorMessage = '바코드 정보를 찾을 수 없습니다.';
        } else if (serverMessage) {
          errorMessage = serverMessage;
        }
      } else if (error.message) {
        errorMessage = `네트워크 오류: ${error.message}`;
      }
      
      if (isConflictError) {
        // 중복 등록의 경우 특별한 처리
        Alert.alert(
          '이미 등록된 식품',
          `바코드: ${barcodeData}\n\n${errorMessage}`,
          [
            {
              text: '취소',
              style: 'cancel',
              onPress: () => {
                setScanEnabled(false); // 스캔 비활성화 유지
                setIsProcessing(false);
              }
            },
            {
              text: '수량 증가',
              onPress: async () => {
                try {
                  // 기존 식품의 수량을 1개 증가시키는 로직
                  // 현재 API에서는 지원하지 않으므로 안내 메시지만 표시
                  Alert.alert(
                    '안내', 
                    '수량 변경은 메인 화면에서 식품을 선택하여 수정할 수 있습니다.',
                    [
                      {
                        text: '확인',
                        onPress: () => {
                          setScanEnabled(false); // 스캔 비활성화 유지
                          setIsProcessing(false);
                        }
                      }
                    ]
                  );
                } catch (updateError) {
                  console.error('수량 업데이트 오류:', updateError);
                  setScanEnabled(false); // 스캔 비활성화 유지
                  setIsProcessing(false);
                }
              }
            }
          ]
        );
      } else {
        // 일반 오류 처리
        Alert.alert('오류', errorMessage, [
          {
            text: '확인',
            onPress: () => {
              setScanEnabled(false); // 스캔 비활성화 유지
              setIsProcessing(false);
            }
          }
        ]);
      }
    }
  }

  return (
    <View style={ScreenStyles.cameraContainer}>
      <CameraView 
        ref={cameraRef}
        style={ScreenStyles.camera} 
        facing={facing} 
        barcodeScannerSettings={
          hasScanned || scanCount > 0 
            ? undefined // 스캔 완료 시 바코드 스캔 기능 완전 비활성화
            : {barcodeTypes: ['qr', 'code128', 'ean13', 'ean8']}
        }
        onBarcodeScanned={hasScanned || scanCount > 0 ? undefined : onBarcodeScanned}
      />
      
      {/* 스캔 가이드라인 오버레이 */}
      <View style={ScreenStyles.scanOverlay}>
        <View style={ScreenStyles.scanArea}>
          <View style={ScreenStyles.scanCorner} />
          <View style={[ScreenStyles.scanCorner, styles.topRight]} />
          <View style={[ScreenStyles.scanCorner, styles.bottomLeft]} />
          <View style={[ScreenStyles.scanCorner, styles.bottomRight]} />
        </View>
        
        {/* 로딩 인디케이터 */}
        {isProcessing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00FF00" />
          </View>
        )}
        
        <Text style={ScreenStyles.instructionText}>
          {hasScanned 
            ? '스캔이 완료되었습니다\n메인 화면으로 돌아갑니다'
            : isProcessing 
            ? '식품 추가 중...'
            : scanEnabled 
            ? '바코드를 카메라 중앙에 맞춰주세요\n(한 번만 인식됩니다)'
            : '스캔 시작 버튼을 눌러 바코드 인식을 시작하세요\n한 번 인식 후 자동으로 종료됩니다'
          }
        </Text>
        
        {scanCount > 0 && (
          <Text style={styles.scanCountText}>
            총 스캔 횟수: {scanCount}
          </Text>
        )}
        
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
            (isProcessing || hasScanned) && styles.processingButton
          ]} 
          onPress={toggleCameraFacing}
          disabled={isProcessing || hasScanned}
        >
          <Text style={styles.buttonText}>
            {hasScanned ? '완료됨' : '카메라 전환'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            scanEnabled ? styles.scanningButton : styles.captureButton,
            (isProcessing || hasScanned) && styles.processingButton
          ]} 
          onPress={enableBarcodeScanning}
          disabled={isProcessing || scanEnabled || hasScanned}
        >
          <Text style={styles.buttonText}>
            {hasScanned 
              ? '스캔 완료' 
              : isProcessing 
              ? '처리 중...' 
              : scanEnabled 
              ? '스캔 중...' 
              : '🔍 스캔 시작'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
    bottom: 64,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    width: '100%',
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 15,
    borderRadius: BorderRadius.xxl,
  },
  backButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(100, 100, 100, 0.8)',
    paddingVertical: 15,
    borderRadius: BorderRadius.xxl,
  },
  captureButton: {
    backgroundColor: 'rgba(0, 150, 0, 0.8)',
  },
  scanningButton: {
    backgroundColor: 'rgba(255, 100, 0, 0.8)',
  },
  processingButton: {
    backgroundColor: 'rgba(100, 100, 100, 0.8)',
  },
  buttonText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.white,
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
});
