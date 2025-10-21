import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserInfo {
  uid: string;
  email: string;
  name: string;
  profile_url: string | null;
  created_at: string;
}

interface AuthData {
  sessionId: string | null;
  userInfo: UserInfo | null;
  isLoggedIn: boolean;
  isFirstLaunch: boolean;
}

const AUTH_STORAGE_KEY = '@smilefood_auth_data';

// 인증 데이터 저장
export const saveAuthData = async (authData: Partial<AuthData>): Promise<boolean> => {
  try {
    // 기존 데이터 로드
    let existingData: AuthData = {
      sessionId: null,
      userInfo: null,
      isLoggedIn: false,
      isFirstLaunch: true
    };
    
    try {
      const existingDataString = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (existingDataString) {
        existingData = JSON.parse(existingDataString);
      }
    } catch (error) {
      // 데이터가 없거나 읽기 실패 시 기본값 사용
      console.log('기존 인증 데이터 없음, 새로 생성');
    }
    
    // 새 데이터로 병합
    const mergedData: AuthData = {
      ...existingData,
      ...authData
    };
    
    // AsyncStorage에 저장
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mergedData));
    console.log('인증 데이터 저장 완료:', mergedData);
    return true;
  } catch (error) {
    console.warn('인증 데이터 저장 실패:', error);
    return false;
  }
};

// 인증 데이터 로드
export const loadAuthData = async (): Promise<AuthData> => {
  try {
    const authDataString = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    
    if (!authDataString) {
      console.log('인증 데이터가 존재하지 않음');
      return {
        sessionId: null,
        userInfo: null,
        isLoggedIn: false,
        isFirstLaunch: true
      };
    }
    
    const authData: AuthData = JSON.parse(authDataString);
    console.log('인증 데이터 로드 완료:', authData);
    return authData;
  } catch (error) {
    console.warn('인증 데이터 로드 실패:', error);
    return {
      sessionId: null,
      userInfo: null,
      isLoggedIn: false,
      isFirstLaunch: true
    };
  }
};

// 세션 ID 저장
export const saveSessionId = async (sessionId: string | null): Promise<boolean> => {
  return await saveAuthData({ sessionId, isLoggedIn: !!sessionId });
};

// 사용자 정보 저장
export const saveUserInfo = async (userInfo: UserInfo | null): Promise<boolean> => {
  return await saveAuthData({ userInfo });
};

// 첫 실행 상태 저장
export const saveFirstLaunch = async (isFirstLaunch: boolean): Promise<boolean> => {
  return await saveAuthData({ isFirstLaunch });
};

// 로그인 상태 저장
export const saveLoginState = async (isLoggedIn: boolean): Promise<boolean> => {
  return await saveAuthData({ isLoggedIn });
};

// 모든 인증 데이터 삭제 (로그아웃)
export const clearAuthData = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    console.log('인증 데이터 삭제 완료');
    return true;
  } catch (error) {
    console.warn('인증 데이터 삭제 실패:', error);
    return false;
  }
};

// 특정 키의 데이터만 삭제
export const removeAuthKey = async (key: keyof AuthData): Promise<boolean> => {
  try {
    const authData = await loadAuthData();
    const updatedData = { ...authData, [key]: key === 'isFirstLaunch' ? true : null };
    return await saveAuthData(updatedData);
  } catch (error) {
    console.warn(`${key} 삭제 실패:`, error);
    return false;
  }
};

// 모든 AsyncStorage 데이터 확인 (디버깅용)
export const getAllAsyncStorageData = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('AsyncStorage 키들:', keys);
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      console.log(`${key}:`, value);
    }
  } catch (error) {
    console.warn('AsyncStorage 데이터 확인 실패:', error);
  }
};