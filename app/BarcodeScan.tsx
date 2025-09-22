import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { foodAPI } from '@/services/api';
import { useAppContext } from '../contexts/AppContext';

export default function BarcodeScanScreen() {
  const router = useRouter();
  const { sessionId, refreshFoodList } = useAppContext();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanCooldown, setScanCooldown] = useState(false);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function onBarcodeScanned(scanningResult: any) {
    if (!isScanning || isProcessing || scanCooldown) return; // 스캔 모드가 아니거나 처리 중이거나 쿨다운 중이면 무시
    
    const barcodeData = scanningResult.data;
    
    // 같은 바코드를 연속으로 스캔하는 것을 방지
    if (lastScannedCode === barcodeData) {
      return;
    }
    
    console.log('바코드 스캔됨:', barcodeData);
    
    // 스캔 후 즉시 스캔 모드 종료 및 쿨다운 시작
    setIsScanning(false);
    setIsProcessing(true);
    setScanCooldown(true);
    setLastScannedCode(barcodeData);
    
    // 3초 후 쿨다운 해제
    setTimeout(() => {
      setScanCooldown(false);
    }, 3000);
    
    try {
      if (!sessionId) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      // 바코드로 식품 추가 (기본 수량 1개)
      const response = await foodAPI.regiFood(sessionId, barcodeData, '1');
      
      if (response.code === 200) {
        Alert.alert(
          '식품 추가 완료', 
          response.message,
          [
            {
              text: '확인',
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
        Alert.alert('오류', response.message);
        // 실패 시 스캔 재시작 가능하도록 상태 초기화
        setLastScannedCode(null);
      }
    } catch (error: any) {
      console.error('바코드 스캔 오류:', error);
      Alert.alert('오류', error.response?.data?.message || '식품 추가에 실패했습니다.');
      // 실패 시 스캔 재시작 가능하도록 상태 초기화
      setLastScannedCode(null);
    } finally {
      setIsProcessing(false);
    }
  }

  function toggleScanning() {
    if (isProcessing || scanCooldown) return; // 처리 중이거나 쿨다운 중이면 토글 불가
    
    setIsScanning(prev => {
      if (!prev) {
        // 스캔 시작 시 이전 스캔 기록 초기화
        setLastScannedCode(null);
      }
      return !prev;
    });
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing={facing} 
        barcodeScannerSettings={{barcodeTypes: ['qr', 'code128', 'ean13']}}
        onBarcodeScanned={onBarcodeScanned}
      />
      
      {/* 스캔 가이드라인 오버레이 */}
      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          <View style={styles.corner} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.instructionText}>
          {isProcessing 
            ? '식품 추가 중...' 
            : scanCooldown 
            ? '잠시 대기해주세요...' 
            : isScanning 
            ? '스캔 중... 바코드를 카메라에 맞춰주세요' 
            : '스캔 버튼을 눌러 바코드를 스캔하세요'
          }
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.text}>뒤로가기</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
          <Text style={styles.text}>카메라 전환</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            styles.scanButton, 
            isScanning && styles.scanningButton,
            (isProcessing || scanCooldown) && styles.processingButton
          ]} 
          onPress={toggleScanning}
          disabled={isProcessing || scanCooldown}
        >
          <Text style={styles.text}>
            {isProcessing 
              ? '처리 중...' 
              : scanCooldown 
              ? '대기 중...' 
              : isScanning 
              ? '스캔 중지' 
              : '스캔 시작'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  overlay: {
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
    borderRadius: 20,
  },
  corner: {
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
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 30,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    width: '100%',
    paddingHorizontal: 32,
    gap: 12,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 15,
    borderRadius: 25,
  },
  backButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(100, 100, 100, 0.8)',
    paddingVertical: 15,
    borderRadius: 25,
  },
  scanButton: {
    backgroundColor: 'rgba(0, 150, 0, 0.8)',
  },
  scanningButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
  },
  processingButton: {
    backgroundColor: 'rgba(100, 100, 100, 0.8)',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});
