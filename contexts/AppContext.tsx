import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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
  clearNavigationStack: () => void;
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
  const clearNavigationStack = useCallback(() => {
    // 로그아웃 시 모든 상태를 초기화
    setSessionId(null);
    setUserInfo(null);
    setIsLoggedIn(false);
    setNavigationReset(true);
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
        // 세션 ID 확인
        const storedSessionId = await AsyncStorage.getItem('sessionId');
        if (storedSessionId) {
          setSessionId(storedSessionId);
          setIsLoggedIn(true);
        }

        // 첫 실행 여부 확인
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        if (hasLaunched) {
          setIsFirstLaunch(false);
        }

        // 사용자 정보 확인
        const storedUserInfo = await AsyncStorage.getItem('userInfo');
        if (storedUserInfo) {
          setUserInfo(JSON.parse(storedUserInfo));
        }
      } catch (error) {
        console.error('앱 초기화 오류:', error);
      }
    };

    initializeApp();
  }, []);

  const handleSetSessionId = useCallback(async (value: string | null) => {
    setSessionId(value);
    if (value) {
      await AsyncStorage.setItem('sessionId', value);
    } else {
      await AsyncStorage.removeItem('sessionId');
    }
  }, []);

  const handleSetIsFirstLaunch = useCallback(async (value: boolean) => {
    setIsFirstLaunch(value);
    if (!value) {
      await AsyncStorage.setItem('hasLaunched', 'true');
    }
  }, []);

  const handleSetUserInfo = useCallback(async (value: UserInfo | null) => {
    setUserInfo(value);
    if (value) {
      await AsyncStorage.setItem('userInfo', JSON.stringify(value));
    } else {
      await AsyncStorage.removeItem('userInfo');
    }
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
