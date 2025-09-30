import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearAuthData, loadAuthData, saveAuthData } from '../utils/storage';

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
    setSessionId(null);
    setUserInfo(null);
    setIsLoggedIn(false);
    setNavigationReset(true);
    
    // 파일 시스템에서도 데이터 제거
    try {
      await clearAuthData();
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
        // 파일 시스템에서 인증 데이터 로드
        const authData = await loadAuthData();
        
        // 세션 ID 설정
        if (authData.sessionId) {
          setSessionId(authData.sessionId);
          setIsLoggedIn(authData.isLoggedIn);
        }

        // 첫 실행 여부 설정
        setIsFirstLaunch(authData.isFirstLaunch);

        // 사용자 정보 설정
        if (authData.userInfo) {
          setUserInfo(authData.userInfo);
        }
      } catch (error) {
        console.error('앱 초기화 오류:', error);
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
    userInfo,
    refreshFoodList,
    setIsLoggedIn,
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
  }), [isLoggedIn, sessionId, isFirstLaunch, userInfo, refreshFoodList, handleSetSessionId, handleSetIsFirstLaunch, handleSetUserInfo, clearNavigationStack, isNavigationReset, setNavigationReset, alertState, showAlert, hideAlert]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};