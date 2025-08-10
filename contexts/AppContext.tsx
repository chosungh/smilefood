import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface UserInfo {
  uid: string;
  email: string;
  name: string;
  profile_url: string | null;
  created_at: string;
}

interface AppContextType {
  isLoggedIn: boolean;
  sessionId: string | null;
  isFirstLaunch: boolean;
  userInfo: UserInfo | null;
  refreshFoodList: (() => void) | null;
  setIsLoggedIn: (value: boolean) => void;
  setSessionId: (value: string | null) => void;
  setIsFirstLaunch: (value: boolean) => void;
  setUserInfo: (value: UserInfo | null) => void;
  setRefreshFoodList: (callback: (() => void) | null) => void;
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
  }), [isLoggedIn, sessionId, isFirstLaunch, userInfo, refreshFoodList, handleSetSessionId, handleSetIsFirstLaunch, handleSetUserInfo]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
