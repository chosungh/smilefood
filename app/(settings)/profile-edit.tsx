import Header from '@/components/Header';
import LabeledTextInput from '@/components/LabeledTextInput';
import { useAppContext } from '@/contexts/AppContext';
import { authAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { userInfo, sessionId, setUserInfo } = useAppContext();

  const [name, setName] = useState(userInfo?.name || '');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageUrl, setImageUrl] = useState(userInfo?.profile_url || '');

  const openImageModal = () => {
    setImageUrl(userInfo?.profile_url || '');
    setImageModalVisible(true);
  };

  const handleConfirmImage = async () => {
    setImageModalVisible(false);
    await handleSaveProfile();
  };

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
      const params = {
        name: trimmed,
        profile_image_url: imageUrl,
      };

      console.log('프로필 업데이트 요청:', { name: trimmed, profile_image_url: imageUrl });

      const response = await authAPI.updateProfile(sessionId, params);
      console.log('프로필 업데이트 응답:', response);

      // 서버 응답에서 업데이트된 정보 확인
      if (response && response.code === 200) {
        setUserInfo(userInfo ? { ...userInfo, name: trimmed, profile_url: imageUrl } : userInfo);
        Alert.alert('완료', '프로필이 저장되었습니다.');
      } else {
        Alert.alert('오류', response?.message || '프로필 저장에 실패했습니다.');
      }
    } catch (e: any) {
      console.error('프로필 업데이트 에러:', e);
      Alert.alert('오류', e?.response?.data?.message || e?.message || '프로필 저장에 실패했습니다.');
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
            <TouchableOpacity onPress={openImageModal} activeOpacity={0.7}>
              {(imageUrl || userInfo?.profile_url) ? (
                <Image
                  source={{ uri: (imageUrl || userInfo?.profile_url) as string }}
                  className="w-[100px] h-[100px] rounded-full"
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
            </TouchableOpacity>
            <TouchableOpacity
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white justify-center items-center border-2 border-[#007AFF]"
              onPress={openImageModal}
            >
              <Ionicons name="camera" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={openImageModal} activeOpacity={0.7}>
            <Text className="text-[#007AFF] text-sm font-medium">프로필 사진 변경</Text>
          </TouchableOpacity>
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
      </ScrollView>

      {/* 프로필 이미지 URL 입력 모달 */}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/20 px-5 py-10">
          <View
            className="w-full max-w-[480px] bg-white rounded-[14px] p-5"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3.84, elevation: 5 }}
          >
            <Text className="text-lg font-bold text-[#333] mb-3 text-center">프로필 이미지 URL</Text>

            <TextInput
              className="border border-[#e0e0e0] rounded-lg px-3.5 py-2.5 text-base bg-white text-[#333] mb-4"
              placeholder="URL을 입력하세요. (비움: 기본이미지)"
              placeholderTextColor="#999"
              autoCapitalize="none"
              value={imageUrl}
              onChangeText={setImageUrl}
            />
            <View className="flex-row justify-end gap-3">
              <TouchableOpacity className="px-4 py-2.5 rounded-lg bg-[#f0f0f0]" onPress={() => setImageModalVisible(false)}>
                <Text className="text-sm text-[#333] font-semibold">취소</Text>
              </TouchableOpacity>
              <TouchableOpacity className="px-4 py-2.5 rounded-lg bg-[#007AFF]" onPress={handleConfirmImage}>
                <Text className="text-sm text-white font-semibold">저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

