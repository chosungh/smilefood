import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { useAppContext } from '../contexts/AppContext';
import { authAPI } from '../services/api';
import { ProfileEditStyles as styles } from '../styles/GlobalStyles';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { userInfo, sessionId, setUserInfo } = useAppContext();
  
  const [name, setName] = useState(userInfo?.name || '');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageUrl, setImageUrl] = useState(userInfo?.profile_url || '');
  const [saving, setSaving] = useState(false);

  const openImageModal = () => {
    setImageUrl(userInfo?.profile_url || '');
    setImageModalVisible(true);
  };

  const handleConfirmImage = () => {
    // 모달은 입력만 받고 저장은 상단 저장 버튼에서 일괄 처리
    if (imageUrl.trim() === '') {
      Alert.alert('오류', '이미지 URL을 입력하세요.');
      return;
    }
    setImageModalVisible(false);
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
      setSaving(true);
      const params: any = {};
      if (trimmed !== (userInfo?.name || '')) params.name = trimmed;
      if (imageUrl !== (userInfo?.profile_url || '')) params.profile_image_url = imageUrl;
      if (Object.keys(params).length === 0) {
        setSaving(false);
        Alert.alert('안내', '변경된 내용이 없습니다.');
        return;
      }
      await authAPI.updateProfile(sessionId, params);
      setUserInfo(userInfo ? { ...userInfo, name: trimmed, profile_url: imageUrl } : userInfo);
      Alert.alert('완료', '프로필이 저장되었습니다.');
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.message || '프로필 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaWrapper backgroundColor="#f8f9fa">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 편집</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveProfile}
          disabled={
            saving ||
            (name.trim() === (userInfo?.name || '') && imageUrl === (userInfo?.profile_url || ''))
          }
        >
          <Text style={[
            styles.saveButtonText,
            (saving || (name.trim() === (userInfo?.name || '') && imageUrl === (userInfo?.profile_url || ''))) && styles.disabledText
          ]}>
            {saving ? '저장 중...' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={openImageModal} activeOpacity={0.7}>
              {userInfo?.profile_url ? (
                <Image 
                  source={{ uri: userInfo.profile_url }} 
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
              autoCapitalize="words"
              returnKeyType="next"
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
              placeholder="이미지 URL을 입력하세요"
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
                <Text style={[styles.modalButtonText, styles.modalPrimaryText]}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
