/**
 * REFACTORING NOTE:
 * 이 파일은 기존 코드를 Tailwind CSS로 변환하고 로직을 최적화한 버전입니다.
 *
 * 주요 변경 사항:
 * 1. Styling: StyleSheet를 모두 제거하고 NativeWind(Tailwind CSS) className으로 교체했습니다.
 *    - 이유: 프로젝트 전체 스타일링 일관성 유지 및 코드 양 감소
 *
 * 2. 미사용 코드 제거:
 *    - scanCount 상태: UI에서 사용되지 않아 제거
 *    - toggleCameraFacing(): 호출처가 없어 제거
 *    - facing 상태: 항상 'back'이므로 상수로 변경
 *    - scanCountText 스타일: 미사용으로 제거
 *
 * 3. Bug Fix: 빈 바코드 데이터 처리 시 scanLockRef 미해제 버그 수정
 *    - 기존: scanLockRef.current = true 설정 후 빈 데이터 체크 시 return만 하여 락이 풀리지 않음
 *    - 변경: 빈 데이터 시 scanLockRef.current = false로 락 해제 추가
 *
 * 4. GlobalStyles 의존성 제거:
 *    - ScreenStyles, GlobalStyles 등의 StyleSheet 의존을 Tailwind 클래스로 대체
 */
import Button from '@/components/Button';
import { ManualBarcodeModal } from '@/components/ManualBarcodeModal';
import { useAppContext } from '@/contexts/AppContext';
import { foodAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BarcodeScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionId, refreshFoodList } = useAppContext();

  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAddedBarcode, setLastAddedBarcode] = useState<string | null>(null);
  const [scanEnabled, setScanEnabled] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const scanLockRef = useRef<boolean>(false);

  // 수동 등록 모달 상태
  const [manualModalVisible, setManualModalVisible] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        {/* 뒤로가기 버튼 */}
        <TouchableOpacity
          className="absolute left-5 z-[1000] p-2 bg-gray-500/50 rounded-full"
          style={{ top: insets.top + 10 }}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-center pb-2.5 text-base text-gray-800">바코드를 스캔하려면 카메라 권한이 필요합니다.</Text>
          <View className="flex-row mt-5 gap-4 justify-center w-full">
            <Button
              title="돌아가기"
              onPress={() => router.back()}
              className="flex-1 max-w-[140px] bg-transparent border border-[#007AFF]"
              textClassName="text-[#007AFF]"
            />
            <Button
              title="계속"
              onPress={requestPermission}
              className="flex-1 max-w-[140px]"
            />
          </View>
        </View>
      </SafeAreaView>
    );
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
      setScanEnabled(false);
      setHasScanned(false);
      scanLockRef.current = false;
      return;
    }
    enableBarcodeScanning();
  }

  // 바코드 스캔 결과 처리 (자동 호출됨)
  async function onBarcodeScanned(scanningResult: BarcodeScanningResult) {
    // 동기 중복 호출 즉시 차단
    if (scanLockRef.current) return;

    // 이미 스캔했거나, 스캔이 비활성화되었거나, 처리 중이면 무시
    if (hasScanned || !scanEnabled || isProcessing) return;

    // 첫 유효 호출에서 바로 락 설정
    scanLockRef.current = true;

    const barcodeData = scanningResult.data;

    // 빈 바코드 데이터 체크 (Bug Fix: 락 해제 추가)
    if (!barcodeData || barcodeData.trim() === '') {
      scanLockRef.current = false;
      return;
    }

    // 햅틱 피드백 (성공)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log('바코드 인식됨:', barcodeData);

    // 이번 스캔 처리 시작 (한 번 시작당 1개 등록)
    setHasScanned(true);
    setScanEnabled(false);
    setIsProcessing(true);
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
        scanLockRef.current = false;
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('오류', response.message, [
          { text: '확인', onPress: () => { setIsProcessing(false); scanLockRef.current = false; } }
        ]);
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
    <SafeAreaView className="flex-1 bg-black">
      {/* 뒤로가기 버튼 (좌측 상단) */}
      <TouchableOpacity
        className="absolute left-5 z-[1000] p-2 bg-gray-500/50 rounded-full"
        style={{ top: insets.top + (insets.top > 0 ? 0 : 20) }}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* 수동 등록 버튼 (우측 상단) */}
      <TouchableOpacity
        className="absolute right-5 bg-gray-500/50 px-3.5 py-2 rounded-full z-[1000]"
        style={{ top: insets.top + (insets.top > 0 ? 0 : 20) }}
        onPress={() => setManualModalVisible(true)}
        disabled={isProcessing}
        activeOpacity={0.8}
      >
        <Text className="text-white text-sm font-semibold">수동 등록</Text>
      </TouchableOpacity>

      <View className="flex-1 justify-center">
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={
            hasScanned || scanLockRef.current
              ? undefined
              : { barcodeTypes: ['code128', 'ean13', 'ean8'] }
          }
          onBarcodeScanned={hasScanned || scanLockRef.current ? undefined : onBarcodeScanned}
        />

        {/* 스캔 가이드라인 오버레이 */}
        <View className="absolute inset-0 justify-center items-center">
          {/* 스캔 영역 가이드 */}
          <View className="w-[250px] h-[250px] relative border-2 border-white/50 rounded-xl" />

          {/* 로딩 인디케이터 */}
          {isProcessing && (
            <View className="absolute top-1/2 left-1/2 w-[50px] h-[50px] justify-center items-center bg-black/70 rounded-xl -translate-x-[25px] -translate-y-[25px]">
              <ActivityIndicator size="large" color="#00FF00" />
            </View>
          )}

          {/* 안내 텍스트 */}
          <Text className="text-white text-base font-semibold mt-8 text-center bg-black/50 px-5 py-2.5 rounded-[10px]">
            {scanEnabled ? '바코드를 카메라 중앙에 맞춰주세요...' : '스캔을 시작하려면 버튼을 눌러주세요.'}
          </Text>

          {/* 마지막 추가된 바코드 정보 */}
          {lastAddedBarcode && (
            <Text className="text-white text-xs font-normal mt-2.5 text-center bg-black/50 px-4 py-1.5 rounded-full overflow-hidden">
              마지막 추가: {lastAddedBarcode}
            </Text>
          )}
        </View>

        {/* 하단 버튼 영역 */}
        <View className="absolute bottom-12 flex-row bg-transparent w-full px-8 gap-3">
          <Button
            title="뒤로가기"
            onPress={() => router.back()}
            disabled={isProcessing}
            className="flex-1 bg-gray-500"
          />
          <Button
            title={isProcessing ? '처리 중...' : scanEnabled ? '스캔 중...' : '스캔 시작'}
            onPress={handleScanButtonPress}
            isLoading={isProcessing}
            className={`flex-1 ${scanEnabled ? 'bg-orange-500' : 'bg-[#007AFF]'}`}
          />
        </View>
      </View>

      {/* 수동 등록 모달 (SafeAreaView 직하에 위치하여 짤림 방지) */}
      <ManualBarcodeModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
        sessionId={sessionId}
        onSuccess={refreshFoodList}
      />
    </SafeAreaView>
  );
}
