import { authAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert
} from 'react-native';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { useAppContext } from '../contexts/AppContext';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { userInfo, clearNavigationStack } = useAppContext();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (!password.trim()) {
      Alert.alert('오류', '비밀번호를 입력해주세요.');
      return;
    }

    if (!userInfo?.email) {
      Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
      return;
    }

    Alert.alert(
      '회원탈퇴',
      '회원을 탈퇴하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
      [
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const response = await authAPI.deleteAccount(userInfo.email, password);
              
              // 성공 시 로그아웃 처리
              clearNavigationStack();
              
              Alert.alert(
                '탈퇴 완료',
                response.message,
                [
                  {
                    text: '확인',
                    onPress: () => {
                      // 네비게이션 스택을 완전히 정리하고 로그인 화면으로 이동
                      router.replace('/login');
                      
                      // 추가로 네비게이션 스택을 정리
                      setTimeout(() => {
                        router.replace('/login');
                      }, 100);
                    },
                  },
                ]
              );
            } catch (error: any) {
              if (error.response?.data?.message) {
                Alert.alert('오류', error.response.data.message);
              } else {
                Alert.alert('오류', '회원탈퇴 중 오류가 발생했습니다.');
              }
            } finally {
              setIsLoading(false);
            }
          },
        },
        {
          text: '취소',
          style: 'cancel',
        }
      ]
    );
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaWrapper style={styles.container} backgroundColor="#f8f9fa">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>회원탈퇴</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>비밀번호 확인</Text>
          <TextInput
            style={styles.passwordInput}
            placeholder="현재 비밀번호를 입력하세요"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            회원탈퇴를 진행하면 모든 데이터가 영구적으로 삭제되며, 복구할 수 없습니다.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDeleteAccount}
            disabled={isLoading}
            >
            <Text style={styles.deleteButtonText}>
              {isLoading ? '처리중...' : '탈퇴하기'}
            </Text>
          </TouchableOpacity>
            
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  passwordInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});