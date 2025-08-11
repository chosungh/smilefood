import { authAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { useAppContext } from '../contexts/AppContext';

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
      console.log(error);
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
          <Text style={styles.value}>{item.ip_address}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>로그인 시간:</Text>
          <Text style={styles.value}>{formatDate(item.created_at)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>마지막 접속:</Text>
          <Text style={styles.value}>{formatDate(item.last_accessed)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>만료 시간:</Text>
          <Text style={styles.value}>{formatDate(item.expires_at)}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaWrapper style={styles.container} backgroundColor="#f8f9fa">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>로그인 기록</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>로그인 기록을 불러오는 중...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper style={styles.container} backgroundColor="#f8f9fa">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>로그인 기록</Text>
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
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deviceText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  cardContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
});
