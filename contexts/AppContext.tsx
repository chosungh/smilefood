import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearAuthData, getAllAsyncStorageData, loadAuthData, saveAuthData } from '../utils/storage';

interface UserInfo {
  uid: string;
  email: string;
  name: string;
  profile_url: string | null;
  created_at: string;
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
}

interface AppContextType {
  isLoggedIn: boolean;
  sessionId: string | null;
  isFirstLaunch: boolean;
  isAppInitialized: boolean;
  userInfo: UserInfo | null;
  refreshFoodList: (() => void) | null;
  isNavigationReset: boolean;
  setIsLoggedIn: (value: boolean) => void;
  setSessionId: (value: string | null) => void;
  setIsFirstLaunch: (value: boolean) => void;
  setUserInfo: (value: UserInfo | null) => void;
  setRefreshFoodList: (callback: (() => void) | null) => void;
  clearNavigationStack: () => Promise<void>;
  setNavigationReset: (value: boolean) => void;
  
  // Alert 관련 상태
  alertState: AlertState;
  showAlert: (title: string, message: string, buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>) => void;
  hideAlert: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [refreshFoodList, setRefreshFoodList] = useState<(() => void) | null>(null);
  const [isNavigationReset, setNavigationReset] = useState(false);
  
  // Alert 상태
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    buttons: []
  });

  // 네비게이션 스택을 정리하는 함수
  const clearNavigationStack = useCallback(async () => {
    // 로그아웃 시 모든 상태를 초기화
    await setSessionId(null);
    await setUserInfo(null);
    await setIsLoggedIn(false);
    setNavigationReset(true);
    
    // 파일 시스템에서도 데이터 제거
    try {
      await clearAuthData();
      console.log('로그아웃 완료 - 모든 인증 데이터 삭제됨');
    } catch (error) {
      console.error('인증 데이터 정리 중 오류:', error);
    }
  }, []);

  // isNavigationReset 상태가 true일 때 자동으로 false로 리셋
  useEffect(() => {
    if (isNavigationReset) {
      const timer = setTimeout(() => {
        setNavigationReset(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isNavigationReset]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // AsyncStorage 데이터 확인 (디버깅용)
        await getAllAsyncStorageData();
        
        // AsyncStorage에서 인증 데이터 로드
        const authData = await loadAuthData();
        
        console.log('로드된 인증 데이터:', authData);
        
        // 세션 ID와 로그인 상태 설정
        if (authData.sessionId && authData.isLoggedIn) {
          setSessionId(authData.sessionId);
          setIsLoggedIn(true);
          console.log('로그인 상태 복원됨:', authData.sessionId);
        } else {
          setSessionId(null);
          setIsLoggedIn(false);
          console.log('로그인 상태 없음');
        }

        // 첫 실행 여부 설정
        setIsFirstLaunch(authData.isFirstLaunch);
        console.log('첫 실행 여부:', authData.isFirstLaunch);

        // 사용자 정보 설정
        if (authData.userInfo) {
          setUserInfo(authData.userInfo);
          console.log('사용자 정보 복원됨:', authData.userInfo.name);
        }
      } catch (error) {
        console.error('앱 초기화 오류:', error);
        // 오류 발생 시 기본값으로 설정
        setSessionId(null);
        setIsLoggedIn(false);
        setIsFirstLaunch(true);
        setUserInfo(null);
      } finally {
        setIsAppInitialized(true);
      }
    };

    initializeApp();
  }, []);

  const handleSetSessionId = useCallback(async (value: string | null) => {
    setSessionId(value);
    await saveAuthData({ 
      sessionId: value, 
      isLoggedIn: !!value 
    });
  }, []);

  const handleSetIsFirstLaunch = useCallback(async (value: boolean) => {
    setIsFirstLaunch(value);
    await saveAuthData({ isFirstLaunch: value });
  }, []);

  const handleSetUserInfo = useCallback(async (value: UserInfo | null) => {
    setUserInfo(value);
    await saveAuthData({ userInfo: value });
  }, []);

  const handleSetIsLoggedIn = useCallback(async (value: boolean) => {
    setIsLoggedIn(value);
    await saveAuthData({ isLoggedIn: value });
  }, []);

  // Alert 표시 함수
  const showAlert = useCallback((title: string, message: string, buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: '확인' }]
    });
  }, []);

  // Alert 숨김 함수
  const hideAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, visible: false }));
  }, []);

  const value = useMemo(() => ({
    isLoggedIn,
    sessionId,
    isFirstLaunch,
    isAppInitialized,
    userInfo,
    refreshFoodList,
    setIsLoggedIn: handleSetIsLoggedIn,
    setSessionId: handleSetSessionId,
    setIsFirstLaunch: handleSetIsFirstLaunch,
    setUserInfo: handleSetUserInfo,
    setRefreshFoodList,
    clearNavigationStack,
    isNavigationReset,
    setNavigationReset,
    alertState,
    showAlert,
    hideAlert
  }), [isLoggedIn, sessionId, isFirstLaunch, isAppInitialized, userInfo, refreshFoodList, handleSetIsLoggedIn, handleSetSessionId, handleSetIsFirstLaunch, handleSetUserInfo, clearNavigationStack, isNavigationReset, setNavigationReset, alertState, showAlert, hideAlert]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};