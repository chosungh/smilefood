import Header from '@/components/Header';
import LabeledTextInput from '@/components/LabeledTextInput';
import { useAppContext } from '@/contexts/AppContext';
import { authAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 선택된 이미지 파일 정보 타입
interface SelectedImage {
  uri: string;
  type: string;
  name: string;
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const { userInfo, sessionId, setUserInfo } = useAppContext();

  const [name, setName] = useState(userInfo?.name || '');
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 로컬에서 선택한 이미지 (아직 업로드 전)
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  // 화면에 표시할 이미지 URI (선택된 로컬 이미지 또는 서버 URL)
  const displayImageUri = selectedImage?.uri || userInfo?.profile_url || '';

  // 애니메이션 값 (화면 높이만큼 아래에 위치했다가 0으로 올라옴)
  const screenHeight = Dimensions.get('window').height;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  // 모달 열릴 때 애니메이션 실행
  useEffect(() => {
    if (pickerModalVisible) {
      // 열릴 때: 아래에서 위로 (0으로 이동)
      slideAnim.setValue(screenHeight); // 초기값 설정 (가끔 리셋 안 되는 경우 대비)
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
    }
  }, [pickerModalVisible, screenHeight, slideAnim]);

  // 모달 닫기 (애니메이션 후 상태 변경)
  const closeModal = () => {
    // 닫을 때: 위에서 아래로 (screenHeight로 이동)
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 250,
      easing: Easing.in(Easing.exp),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setPickerModalVisible(false);
      }
    });
  };

  // 카메라 권한 요청
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        '권한 필요',
        '카메라를 사용하려면 카메라 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
      );
      return false;
    }
    return true;
  };

  // 갤러리 권한 요청
  const requestMediaLibraryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        '권한 필요',
        '갤러리에 접근하려면 사진 라이브러리 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
      );
      return false;
    }
    return true;
  };

  // 이미지 피커 공통 옵션
  const imagePickerOptions: ImagePicker.ImagePickerOptions = {
    // 경고 해결 및 최신 방식: 문자열 'images' 사용
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  };

  // 카메라로 촬영
  const handleTakePhoto = () => {
    console.log('[ImagePicker] handleTakePhoto 호출됨');
    setPickerModalVisible(false);
    // 모달이 완전히 사라질 때까지 충분히 대기 (1초)
    setTimeout(async () => {
      try {
        console.log('[ImagePicker] 카메라 권한 요청 시작');
        const hasPermission = await requestCameraPermission();
        console.log('[ImagePicker] 카메라 권한 결과:', hasPermission);
        if (!hasPermission) return;

        console.log('[ImagePicker] launchCameraAsync 호출');
        const result = await ImagePicker.launchCameraAsync(imagePickerOptions);
        console.log('[ImagePicker] 카메라 결과:', result.canceled ? '취소됨' : '성공');
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          const fileName = asset.fileName || `profile_${Date.now()}.jpg`;
          const mimeType = asset.mimeType || 'image/jpeg';
          setSelectedImage({ uri: asset.uri, type: mimeType, name: fileName });
        }
      } catch (error: any) {
        console.error('[ImagePicker] 카메라 에러:', error);
        Alert.alert('카메라 에러', error?.message || String(error));
      }
    }, 1000);
  };

  // 갤러리에서 선택
  const handlePickFromGallery = () => {
    console.log('[ImagePicker] handlePickFromGallery 호출됨');
    setPickerModalVisible(false);
    // 모달이 완전히 사라질 때까지 충분히 대기 (1초)
    setTimeout(async () => {
      try {
        console.log('[ImagePicker] 갤러리 권한 요청 시작');
        const hasPermission = await requestMediaLibraryPermission();
        console.log('[ImagePicker] 갤러리 권한 결과:', hasPermission);
        if (!hasPermission) return;

        console.log('[ImagePicker] launchImageLibraryAsync 호출');
        const result = await ImagePicker.launchImageLibraryAsync(imagePickerOptions);
        console.log('[ImagePicker] 갤러리 결과:', result.canceled ? '취소됨' : '성공');
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          const fileName = asset.fileName || `profile_${Date.now()}.jpg`;
          const mimeType = asset.mimeType || 'image/jpeg';
          setSelectedImage({ uri: asset.uri, type: mimeType, name: fileName });
        }
      } catch (error: any) {
        console.error('[ImagePicker] 갤러리 에러:', error);
        Alert.alert('갤러리 에러', error?.message || String(error));
      }
    }, 1000);
  };

  // 기본 이미지로 변경 (이미지 제거)
  const handleResetToDefault = () => {
    setPickerModalVisible(false);
    setSelectedImage(null);
    // 빈 문자열로 서버에 전송하여 기본 이미지로 변경
    handleSaveProfileWithImage('');
  };

  // 프로필 저장 (이미지 파일 업로드 포함)
  const handleSaveProfile = async () => {
    if (!sessionId) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      Alert.alert('오류', '이름을 입력하세요.');
      return;
    }

    try {
      setIsUploading(true);

      // [240213] 서버가 아직 이미지 업로드를 지원하지 않음.
      // 따라서 이미지는 로컬 스토리지에만 저장하고, 서버에는 이름만 업데이트함.
      /*
      // 이미지 파일 객체 또는 기존 URL 준비
      let profileImagePayload: string | { uri: string; type: string; name: string } | undefined;
      if (selectedImage) {
        // 새로 선택한 이미지를 파일 객체로 전송
        profileImagePayload = {
          uri: Platform.OS === 'ios' ? selectedImage.uri.replace('file://', '') : selectedImage.uri,
          type: selectedImage.type,
          name: selectedImage.name,
        };
      }
      */

      // 이름만 서버에 업데이트 요청
      const params = {
        name: trimmed,
        // profile_image_url: profileImagePayload // 이미지 전송 제외
      };

      console.log('프로필 업데이트 요청 (이름만):', { name: trimmed });

      const response = await authAPI.updateProfile(sessionId, params);
      console.log('프로필 업데이트 응답:', response);

      if (response && response.code === 200) {
        // 서버 업데이트 성공 시

        // 새 이미지가 선택되었다면 로컬 URI를 사용, 아니면 기존 프로필 URL 유지
        // 주의: 로컬 URI는 앱 재설치 시 사라질 수 있음. 임시 방편.
        const newProfileUrl = selectedImage ? selectedImage.uri : userInfo?.profile_url;

        // Context 및 AsyncStorage 업데이트 (이미지는 로컬 URI로 덮어씌움)
        setUserInfo(userInfo ? { ...userInfo, name: trimmed, profile_url: newProfileUrl || null } : userInfo);
        setSelectedImage(null); // 로컬 선택 상태 초기화
        Alert.alert('완료', '프로필이 저장되었습니다.');
      } else {
        Alert.alert('오류', response?.message || '프로필 저장에 실패했습니다.');
      }
    } catch (e: any) {
      console.error('프로필 업데이트 에러:', e);
      Alert.alert('오류', e?.response?.data?.message || e?.message || '프로필 저장에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 기본 이미지 변경 시 전용 저장 함수
  const handleSaveProfileWithImage = async (imageUrl: string) => {
    if (!sessionId) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    try {
      setIsUploading(true);
      const trimmed = name.trim() || userInfo?.name || '';

      // [240213] 서버 이미지 미지원으로 인해 로컬 처리
      /*
      const params = {
        name: trimmed,
        profile_image_url: imageUrl,
      };
      const response = await authAPI.updateProfile(sessionId, params);
      */

      // 이름 업데이트를 위해 API 호출은 함 (이미지 제외)
      const params = { name: trimmed };
      const response = await authAPI.updateProfile(sessionId, params);

      if (response && response.code === 200) {
        // 이미지를 빈 문자열(기본)로 설정
        setUserInfo(userInfo ? { ...userInfo, name: trimmed, profile_url: '' } : userInfo);
        Alert.alert('완료', '프로필 이미지가 변경되었습니다.');
      } else {
        Alert.alert('오류', response?.message || '프로필 이미지 변경에 실패했습니다.');
      }
    } catch (e: any) {
      console.error('프로필 이미지 변경 에러:', e);
      Alert.alert('오류', e?.response?.data?.message || e?.message || '프로필 이미지 변경에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F4F6]">
      {/* Header */}
      <Header
        title="프로필 편집"
        showBack={true}
        showChat={false}
        showSettings={false}
      />

      {/* Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View className="items-center py-[30px] mb-5">
          <View className="relative mb-3">
            <TouchableOpacity onPress={() => setPickerModalVisible(true)} activeOpacity={0.7}>
              {displayImageUri ? (
                <Image
                  source={{ uri: displayImageUri }}
                  className="w-[100px] h-[100px] rounded-full"
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View className="w-[100px] h-[100px] rounded-full bg-[#007AFF] justify-center items-center">
                  <Text className="text-white text-4xl font-bold">
                    {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              {/* 업로드 중 오버레이 */}
              {isUploading && (
                <View className="absolute inset-0 rounded-full bg-black/40 justify-center items-center">
                  <ActivityIndicator color="#fff" size="large" />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white justify-center items-center border-2 border-[#007AFF]"
              onPress={() => setPickerModalVisible(true)}
            >
              <Ionicons name="camera" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setPickerModalVisible(true)} activeOpacity={0.7}>
            <Text className="text-[#007AFF] text-sm font-medium">프로필 사진 변경</Text>
          </TouchableOpacity>
          {/* 선택된 이미지가 있을 때 저장 안내 */}
          {selectedImage && (
            <Text className="text-xs text-[#999] mt-1">새 이미지가 선택됨 · 저장 시 반영됩니다</Text>
          )}
        </View>

        {/* Form Section */}
        <View className="bg-white mx-5 rounded-xl p-5">
          <LabeledTextInput
            label="이름"
            value={name}
            onChangeText={setName}
            placeholder="이름을 입력하세요"
            placeholderTextColor="#666"
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={async () => {
              const trimmed = name.trim();
              if (trimmed.length > 0) {
                await handleSaveProfile();
              }
            }}
          />

          <View className="mb-5">
            <Text className="text-base font-semibold text-[#333] mb-2">이메일</Text>
            <Text className="text-base text-[#666]">
              {userInfo?.email || '-'}
            </Text>
          </View>

          <View className="mb-5">
            <Text className="text-base font-semibold text-[#333] mb-2">가입일</Text>
            <Text className="text-base text-[#666]">
              {userInfo?.created_at ? new Date(userInfo.created_at).toLocaleDateString('ko-KR') : '-'}
            </Text>
          </View>
        </View>

        {/* 저장 버튼 */}
        <View className="mx-5 mt-5 mb-10">
          <TouchableOpacity
            className={`py-3.5 rounded-xl items-center ${isUploading ? 'bg-[#007AFF]/50' : 'bg-[#007AFF]'}`}
            onPress={handleSaveProfile}
            disabled={isUploading}
            activeOpacity={0.8}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">프로필 저장</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 이미지 선택 ActionSheet 스타일 모달 */}
      <Modal
        visible={pickerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View className="flex-1 justify-end bg-black/40">
          {/* 배경 영역 (터치 시 모달 닫기) - bg-black/40은 상위 View로 이동하여 페이드 효과 적용 */}
          <Pressable
            className="absolute inset-0"
            onPress={closeModal}
          />

          {/* 컨텐츠 영역 (슬라이드 애니메이션) */}
          <Animated.View
            style={{
              transform: [{ translateY: slideAnim }]
            }}
            className="bg-white rounded-t-2xl pb-8 pt-2"
          >
            {/* 핸들바 */}
            <View className="items-center py-2 mb-2">
              <View className="w-10 h-1 rounded-full bg-[#D1D5DB]" />
            </View>

            <Text className="text-lg font-bold text-[#333] text-center mb-4">프로필 사진 변경</Text>

            {/* 카메라로 촬영 */}
            <TouchableOpacity
              className="flex-row items-center px-6 py-4 active:bg-[#F2F4F6]"
              onPress={handleTakePhoto}
            >
              <View className="w-10 h-10 rounded-full bg-[#E8F4FD] justify-center items-center mr-4">
                <Ionicons name="camera-outline" size={22} color="#007AFF" />
              </View>
              <Text className="text-base text-[#333]">카메라로 촬영</Text>
            </TouchableOpacity>

            {/* 갤러리에서 선택 */}
            <TouchableOpacity
              className="flex-row items-center px-6 py-4 active:bg-[#F2F4F6]"
              onPress={handlePickFromGallery}
            >
              <View className="w-10 h-10 rounded-full bg-[#E8F0FE] justify-center items-center mr-4">
                <Ionicons name="images-outline" size={22} color="#007AFF" />
              </View>
              <Text className="text-base text-[#333]">갤러리에서 선택</Text>
            </TouchableOpacity>

            {/* 기본 이미지로 변경 */}
            {(displayImageUri) && (
              <TouchableOpacity
                className="flex-row items-center px-6 py-4 active:bg-[#F2F4F6]"
                onPress={handleResetToDefault}
              >
                <View className="w-10 h-10 rounded-full bg-[#FEE2E2] justify-center items-center mr-4">
                  <Ionicons name="person-outline" size={22} color="#EF4444" />
                </View>
                <Text className="text-base text-[#EF4444]">기본 이미지로 변경</Text>
              </TouchableOpacity>
            )}

            {/* 취소 */}
            <View className="mx-5 mt-3">
              <TouchableOpacity
                className="py-3.5 rounded-xl bg-[#F2F4F6] items-center"
                onPress={closeModal}
              >
                <Text className="text-base font-semibold text-[#666]">취소</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
