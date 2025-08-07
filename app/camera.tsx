import { Camera } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { useAppContext } from '../contexts/AppContext';

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = Math.min(width, height) * 0.6;

export default function CameraScreen() {
  const router = useRouter();
  const { sessionId } = useAppContext();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [count, setCount] = useState('1');
  const [isRegistering, setIsRegistering] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;

  // sessionId가 없으면 로그인 화면으로 이동
  useEffect(() => {
    if (sessionId === null) {
      router.replace('/login');
    }
  }, [sessionId, router]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        console.log('Camera permission status:', status);
        setHasPermission(status === 'granted');
        
        if (status !== 'granted') {
          Alert.alert(
            '카메라 권한 필요',
            '바코드 스캔을 위해 카메라 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
            [
              { text: '취소', style: 'cancel' },
              { text: '설정으로 이동', onPress: () => router.back() }
            ]
          );
        }
      } catch (error) {
        console.error('Camera permission error:', error);
        setHasPermission(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (isModalVisible) {
      // 모달을 아래에서 위로 슬라이드
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      // 모달을 위에서 아래로 슬라이드
      Animated.spring(slideAnim, {
        toValue: height,
        useNativeDriver: true,
      }).start();
    }
  }, [isModalVisible]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    setBarcode(data);
    setIsModalVisible(true);
  };

  const handleRegister = async () => {
    if (!sessionId || !barcode || !count) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    setIsRegistering(true);
    
    try {
      const response = await fetch('https://ggcg.szk.kr/food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sid: sessionId,
          barcode: barcode,
          count: parseInt(count),
        }),
      });

      const result = await response.json();
      
      if (result.code === 200) {
        Alert.alert('성공', '음식이 등록되었습니다.');
        handleCloseModal();
      } else {
        Alert.alert('오류', result.message || '등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Food registration error:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setScanned(false);
    setBarcode('');
    setCount('1');
  };

  const handleBack = () => {
    router.back();
  };

  // sessionId가 없으면 로딩 화면 표시
  if (sessionId === null) {
    return (
      <SafeAreaWrapper style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>세션을 확인하는 중...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (hasPermission === null) {
    return (
      <SafeAreaWrapper style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>카메라 권한을 확인하는 중...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaWrapper style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>카메라 접근 권한이 필요합니다.</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>뒤로 가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper style={styles.container}>
      {/* 카메라 뷰 */}
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          type="back"
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          barCodeScannerSettings={{
            barCodeTypes: ['upc_a', 'ean13', 'ean8'],
          }}
        >
          {/* 스캔 영역 가이드 */}
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </View>
            <Text style={styles.scanText}>바코드를 사각형 안에 맞춰주세요</Text>
          </View>
        </Camera>
      </View>

      {/* 뒤로 가기 버튼 */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>← 뒤로</Text>
      </TouchableOpacity>

      {/* 식품 등록 모달 */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>식품 등록</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>바코드</Text>
                <TextInput
                  style={styles.input}
                  value={barcode}
                  onChangeText={setBarcode}
                  placeholder="바코드 번호"
                  editable={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>수량</Text>
                <TextInput
                  style={styles.input}
                  value={count}
                  onChangeText={setCount}
                  placeholder="수량을 입력하세요"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isRegistering && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isRegistering}
            >
              {isRegistering ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>등록하기</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#007AFF',
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#007AFF',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#007AFF',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#007AFF',
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  modalBody: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  registerButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
