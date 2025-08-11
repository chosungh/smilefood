import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getUserAgent } from '../utils/userAgent';

const API_BASE_URL = 'https://ggcg.szk.kr';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': getUserAgent(),
  },
});

// 요청 인터셉터 - sessionId 추가
api.interceptors.request.use(
  async (config) => {
    // sessionId가 있으면 헤더에 추가
    const sessionId = await AsyncStorage.getItem('sessionId');
    if (sessionId) {
      config.headers['Authorization'] = `Bearer ${sessionId}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // 인증 실패 시 sessionId 삭제
      await AsyncStorage.removeItem('sessionId');
      // 로그인 화면으로 리다이렉트 로직 추가 필요
    }
    // 404 에러는 리소스가 존재하지 않는 것이므로 그대로 전달
    // 다른 에러들도 그대로 전달하여 각 API 호출에서 적절히 처리하도록 함
    return Promise.reject(error);
  }
);

// FormData 헬퍼 함수
const createFormData = (data: any) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    formData.append(key, data[key]);
  });
  return formData;
};

// API 함수들
export const authAPI = {
  // 로그인
  login: async (email: string, password: string) => {
    const formData = createFormData({ email, password });
    const response = await api.post('/session', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 로그아웃
  logout: async (sid: string) => {
    const formData = createFormData({ sid });
    const response = await api.delete('/session', {
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 회원가입
  register: async (email: string, password: string, name: string) => {
    const formData = createFormData({ email, password, name });
    const response = await api.post('/user', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 이메일 인증 코드 전송
  sendEmailVerificationCode: async (email: string) => {
    const formData = createFormData({ email });
    const response = await api.post('/user/send_email_verify_code', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 이메일 인증 코드 확인
  verifyEmailCode: async (email: string, code: string) => {
    const formData = createFormData({ email, code });
    const response = await api.post('/user/verify_code', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 비밀번호 찾기
  findPassword: async (email: string) => {
    const formData = createFormData({ email });
    const response = await api.post('/user/find_password', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 세션 정보 조회
  getSessionInfo: async (sid: string) => {
    const response = await api.get(`/session?sid=${sid}`);
    return response.data;
  },

  // 유저 정보 조회
  getUserInfo: async (uid: string) => {
    const response = await api.get(`/user?uid=${uid}`);
    return response.data;
  },

  // 회원탈퇴
  deleteAccount: async (email: string, password: string) => {
    const formData = createFormData({ email, password });
    const response = await api.delete('/user', {
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 세션 목록 조회
  getSessionList: async (sid: string) => {
    const response = await api.get(`/session/list?sid=${sid}`);
    return response.data;
  },
};

// 음식 관련 타입 정의
export interface FoodItem {
  barcode: string;
  count: number;
  created_at: string;
  description: string;
  expiration_date: string;
  expiration_date_desc: string;
  fid: string;
  image_url: string;
  name: string;
  type: string;
  uid: string;
  volume: string;
  is_active: number; // 활성화 상태 (1: 활성화, 0: 비활성화)
}

// 채팅 관련 타입 정의
export interface ChatInfo {
  created_at: string;
  fcid: string;
  response: string | null;
  status: 'created' | 'queued' | 'creating' | 'completed' | 'failed';
  uid: string;
  updated_at: string;
  usage_input_token: number;
  usage_output_token: number;
}

export interface ChatResponse {
  code: number;
  data: {
    chat_info: ChatInfo;
    food_ids: string[];
  };
  message: string;
}

export interface ChatListResponse {
  code: number;
  data: {
    chat_list: {
      chat_info: ChatInfo;
      food_ids: string[];
    }[];
  };
  message: string;
}

export interface FoodListResponse {
  code: number;
  data: {
    food_list: FoodItem[];
  };
  message: string;
}

// 음식 관련 API 함수들
export const foodAPI = {
  // 음식 목록 조회
  getFoodList: async (sid: string): Promise<FoodListResponse> => {
    const response = await api.get(`/food/list?sid=${sid}`);
    return response.data;
  },

  // AI 음식 추천 요청 (POST)
  requestFoodChat: async (sid: string, fidList: string[]): Promise<ChatResponse> => {
    const formData = new FormData();
    formData.append('sid', sid);
    
    // fid_list로 여러 fid를 추가
    fidList.forEach(fid => {
      formData.append('fid', fid);
    });
    
    const response = await api.post('/food/chat', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // AI 음식 추천 상태 확인 (GET)
  getFoodChatStatus: async (sid: string, fcid: string): Promise<ChatResponse> => {
    const response = await api.get(`/food/chat?sid=${sid}&fcid=${fcid}`);
    return response.data;
  },

  // 채팅 내역 조회
  getChatList: async (sid: string): Promise<ChatListResponse> => {
    const response = await api.get(`/food/chat/list?sid=${sid}`);
    return response.data;
  },

  // 음식 등록
  regiFood: async (sid: string, barcode: string, count: string) => {
    const formData = createFormData({ sid, barcode, count });
    
    const response = await api.post('/food', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 음식 삭제
  deleteFood: async (sid: string, fid: string) => {
    const formData = createFormData({ sid, fid });
    const response = await api.delete('/food', {
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 개별 음식 정보 조회
  getFoodInfo: async (sid: string, fid?: string) => {
    const params = `?sid=${sid}&fid=${fid}`;
    const response = await api.get(`/food${params}`);
    return response.data;
  },
};

export default api;
