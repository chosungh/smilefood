import Header from '@/components/Header';
import LabeledTextInput from '@/components/LabeledTextInput';
import { useAppContext } from '@/contexts/AppContext';
import { authAPI } from '@/services/api';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileEditScreen() {
  const { userInfo, sessionId, setUserInfo } = useAppContext();

  const [name, setName] = useState(userInfo?.name || '');
  const [isUploading, setIsUploading] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileUrl, setProfileUrl] = useState(userInfo?.profile_url || '');
  const [isSavingProfileUrl, setIsSavingProfileUrl] = useState(false);

  // 모달 열릴 때 현재 profile_url로 입력값 동기화
  useEffect(() => {
    if (profileModalVisible) {
      setProfileUrl(userInfo?.profile_url || '');
    }
  }, [profileModalVisible, userInfo?.profile_url]);

  // 프로필 저장 (이름만 서버에 업데이트)
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

      const params = { name: trimmed };
      const response = await authAPI.updateProfile(sessionId, params);

      if (response && response.code === 200) {
        setUserInfo(userInfo ? { ...userInfo, name: trimmed } : userInfo);
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

  // 프로필 URL 모달에서 저장
  const handleSaveProfileUrl = async () => {
    if (!sessionId) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }
    const trimmedName = name.trim() || userInfo?.name || '';
    const trimmedUrl = profileUrl.trim();

    try {
      setIsSavingProfileUrl(true);
      const params = { name: trimmedName, profile_image_url: trimmedUrl };
      const response = await authAPI.updateProfile(sessionId, params);

      if (response && response.code === 200) {
        setUserInfo(
          userInfo ? { ...userInfo, name: trimmedName, profile_url: trimmedUrl || null } : userInfo,
        );
        setProfileModalVisible(false);
        Alert.alert('완료', '프로필 이미지 URL이 저장되었습니다.');
      } else {
        Alert.alert('오류', response?.message || '저장에 실패했습니다.');
      }
    } catch (e: any) {
      console.error('프로필 URL 저장 에러:', e);
      Alert.alert('오류', e?.response?.data?.message || e?.message || '저장에 실패했습니다.');
    } finally {
      setIsSavingProfileUrl(false);
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
        {/* Profile Image Section - 클릭 시 프로필 URL 편집 모달 */}
        <View className="items-center py-[30px] mb-5">
          <TouchableOpacity
            onPress={() => setProfileModalVisible(true)}
            activeOpacity={0.8}
            className="items-center"
          >
            <View className="relative mb-2">
              {userInfo?.profile_url ? (
                <Image
                  source={{ uri: userInfo.profile_url }}
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
              {isUploading && (
                <View className="absolute inset-0 rounded-full bg-black/40 justify-center items-center">
                  <ActivityIndicator color="#fff" size="large" />
                </View>
              )}
            </View>
            <Text className="text-[#007AFF] text-sm font-medium">프로필 편집</Text>
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

      {/* 프로필 URL 편집 모달 */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-center bg-black/40 px-5"
          onPress={() => setProfileModalVisible(false)}
        >
          <Pressable className="bg-white rounded-2xl p-5" onPress={(e) => e.stopPropagation()}>
            <Text className="text-lg font-bold text-[#333] text-center mb-4">프로필 편집</Text>
            <LabeledTextInput
              label="프로필 이미지 URL"
              value={profileUrl}
              onChangeText={setProfileUrl}
              placeholder="https://..."
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-[#F2F4F6] items-center"
                onPress={() => setProfileModalVisible(false)}
              >
                <Text className="text-base font-semibold text-[#666]">취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl items-center ${isSavingProfileUrl ? 'bg-[#007AFF]/50' : 'bg-[#007AFF]'}`}
                onPress={handleSaveProfileUrl}
                disabled={isSavingProfileUrl}
              >
                {isSavingProfileUrl ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white text-base font-semibold">저장</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
