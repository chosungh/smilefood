import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'https://ggcg.szk.kr';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
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

  // 식품 추가
  regiFood: async (sid: string, barcode: string, count: string) => {
    const formData = createFormData({ sid, barcode, count });
    const response = await api.post('/food', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 식품 리스트 조회
  getFoodListInfo: async (sid: string) => {
    const response = await api.get(`/food/list?sid=${sid}`);
    return response.data;
  },

  // 식품 삭제
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

  FoodChat: async (sid: string, fid1: string, fid2: string) => {
    const formData = createFormData({ sid, fid1, fid2 });
    const response = await api.get('/food/chat', {
      params: formData,
      headers: {
        'Content-Type': 'application/json',
      },
    } );
    return response.data;
  }
};

export default api;
