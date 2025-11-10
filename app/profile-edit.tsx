import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../contexts/AppContext';
import { authAPI } from '../services/api';
import { ProfileEditStyles as styles } from '../styles/GlobalStyles';

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
    
    handleSaveProfile();
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
      const params: any = {
        name: trimmed,
        profile_image_url: imageUrl
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 편집</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={openImageModal} activeOpacity={0.7}>
              {(imageUrl || userInfo?.profile_url) ? (
                <Image 
                  source={{ uri: (imageUrl || userInfo?.profile_url) as string }} 
                  style={styles.avatar}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.editImageButton} onPress={openImageModal}>
              <Ionicons name="camera" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={openImageModal} activeOpacity={0.7}>
            <Text style={styles.changePhotoText}>프로필 사진 변경</Text>
          </TouchableOpacity>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이름</Text>
            <TextInput
              style={styles.input}
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
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일</Text>
              <Text style={styles.readOnlyText}>
                {userInfo?.email || '-'}
              </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>가입일</Text>
            <View>
              <Text style={styles.readOnlyText}>
                {userInfo?.created_at ? new Date(userInfo.created_at).toLocaleDateString('ko-KR') : '-'}
              </Text>
            </View>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>프로필 이미지 URL</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="URL을 입력하세요. (비움: 기본이미지)"
              placeholderTextColor="#999"
              autoCapitalize="none"
              value={imageUrl}
              onChangeText={setImageUrl}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setImageModalVisible(false)}>
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalPrimary]} onPress={handleConfirmImage}>
                <Text style={[styles.modalButtonText, styles.modalPrimaryText]}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
