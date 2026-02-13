import Header from '@/components/Header';
import { useAppContext } from '@/contexts/AppContext';
import { authAPI } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    return isActive === 1 ? 'bg-green-500' : 'bg-gray-500';
  };

  const getStatusTextColor = (isActive: number) => {
    return isActive === 1 ? 'text-green-500' : 'text-gray-500';
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
    <View className="bg-white rounded-xl mb-4 shadow-sm elevation-5 overflow-hidden">
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center">
          <View className={`w-2 h-2 rounded-full mr-1.5 ${getStatusColor(item.is_active)}`} />
          <Text className={`text-sm font-semibold ${getStatusTextColor(item.is_active)}`}>
            {getStatusText(item.is_active)}
          </Text>
        </View>
        <Text className="text-xs text-gray-500 flex-1 text-right ml-2" numberOfLines={1} ellipsizeMode="tail">{item.user_agent}</Text>
      </View>

      <View className="p-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm text-gray-500 font-medium">IP 주소:</Text>
          <Text className="text-sm text-gray-800 flex-1 text-right ml-2">{maskIPAddress(item.ip_address)}</Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-gray-500 font-medium">로그인 시간:</Text>
          <Text className="text-sm text-gray-800">{formatDate(item.created_at)}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F2F4F6]">
        <Header
          title="로그인 기록"
          showBack={true}
          showChat={false}
          showSettings={false}
        />

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-4 text-base text-gray-500">로그인 기록을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F4F6]">
      {/* Header */}
      <Header
        title="로그인 기록"
        showBack={true}
        showChat={false}
        showSettings={false}
      />

      {/* Content */}
      <View className="flex-1 pt-5">
        {error ? (
          <View className="flex-1 justify-center items-center px-5">
            <Text className="text-base text-red-500 text-center mb-5">{error}</Text>
            <TouchableOpacity
              className="bg-blue-500 px-5 py-3 rounded-lg"
              onPress={fetchSessionList}
            >
              <Text className="text-white text-base font-semibold">다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : sessions.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-base text-gray-500">로그인 기록이 없습니다.</Text>
          </View>
        ) : (
          <FlatList
            data={sessions}
            renderItem={renderSessionCard}
            keyExtractor={(item, index) => `${item.uid}-${index}`}
            contentContainerClassName="px-5 pb-5"
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

