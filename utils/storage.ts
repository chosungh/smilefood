import * as FileSystem from 'expo-file-system';

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

const CACHE_DIR = (FileSystem as any).documentDirectory + 'smilefood/';
const AUTH_FILE = CACHE_DIR + 'auth.json';

// 캐시 디렉토리 생성
const ensureCacheDir = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  } catch (error) {
    console.warn('캐시 디렉토리 생성 실패:', error);
  }
};

// 인증 데이터 저장
export const saveAuthData = async (authData: Partial<AuthData>): Promise<boolean> => {
  try {
    await ensureCacheDir();
    
    // 기존 데이터 로드
    let existingData: AuthData = {
      sessionId: null,
      userInfo: null,
      isLoggedIn: false,
      isFirstLaunch: true
    };
    
    try {
      const fileInfo = await FileSystem.getInfoAsync(AUTH_FILE);
      if (fileInfo.exists) {
        const existingFile = await FileSystem.readAsStringAsync(AUTH_FILE);
        existingData = JSON.parse(existingFile);
      }
    } catch (error) {
      // 파일이 없거나 읽기 실패 시 기본값 사용
      console.log('기존 인증 데이터 없음, 새로 생성');
    }
    
    // 새 데이터로 병합
    const mergedData: AuthData = {
      ...existingData,
      ...authData
    };
    
    // 파일에 저장
    await FileSystem.writeAsStringAsync(AUTH_FILE, JSON.stringify(mergedData, null, 2));
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
    await ensureCacheDir();
    
    const fileInfo = await FileSystem.getInfoAsync(AUTH_FILE);
    if (!fileInfo.exists) {
      console.log('인증 데이터 파일이 존재하지 않음');
      return {
        sessionId: null,
        userInfo: null,
        isLoggedIn: false,
        isFirstLaunch: true
      };
    }
    
    const fileContent = await FileSystem.readAsStringAsync(AUTH_FILE);
    const authData: AuthData = JSON.parse(fileContent);
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
    const fileInfo = await FileSystem.getInfoAsync(AUTH_FILE);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(AUTH_FILE);
    }
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