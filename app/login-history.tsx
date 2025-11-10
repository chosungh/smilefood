import { authAPI } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../contexts/AppContext';
import { LoginHistoryStyles as styles } from '../styles/GlobalStyles';

interface SessionInfo {
  created_at: string;
  expires_at: string;
  ip_address: string;
  is_active: number;
  last_accessed: string;
  uid: string;
  user_agent: string;
}

interface SessionListResponse {
  code: number;
  data: {
    sessions_info: SessionInfo[];
  };
  message: string;
}

export default function LoginHistoryScreen() {
  const router = useRouter();
  const { sessionId } = useAppContext();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionList();
  }, []);

  const fetchSessionList = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!sessionId) {
        setError('세션 정보가 없습니다.');
        return;
      }

      const response: SessionListResponse = await authAPI.getSessionList(sessionId);
      
      if (response.code === 200) {
        setSessions(response.data.sessions_info);
      } else {
        setError(response.message || '세션 목록을 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || '세션 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (isActive: number) => {
    return isActive === 1 ? '활성 (현재)' : '비활성';
  };

  const getStatusColor = (isActive: number) => {
    return isActive === 1 ? '#28a745' : '#6c757d';
  };

  const maskIPAddress = (ip: string) => {
    // IPv4 주소 마스킹 (예: 192.168.1.100 -> 192.168.xxx.xxx)
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.xxx.xxx`;
      }
    }
    
    // IPv6 주소 마스킹 (예: 2001:0db8:85a3:0000:0000:8a2e:0370:7334 -> 2001:0db8:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx)
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 4) {
        // 앞의 2개 부분만 보여주고 나머지는 xxxx로 마스킹
        const maskedParts = parts.map((part, index) => 
          index < 4 ? part : 'xxxx'
        );
        return maskedParts.join(':');
      }
    }
    
    // 기타 경우 원본 반환
    return ip;
  };

  const renderSessionCard = ({ item }: { item: SessionInfo }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.is_active) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.is_active) }]}>
            {getStatusText(item.is_active)}
          </Text>
        </View>
        <Text style={styles.deviceText}>{item.user_agent}</Text>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>IP 주소:</Text>
          <Text style={styles.value}>{maskIPAddress(item.ip_address)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>로그인 시간:</Text>
          <Text style={styles.value}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>로그인 기록</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>로그인 기록을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>로그인 기록</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchSessionList}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>로그인 기록이 없습니다.</Text>
          </View>
        ) : (
          <FlatList
            data={sessions}
            renderItem={renderSessionCard}
            keyExtractor={(item, index) => `${item.uid}-${index}`}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

