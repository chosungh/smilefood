import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppContextType {
  isLoggedIn: boolean;
  sessionId: string | null;
  isFirstLaunch: boolean;
  setIsLoggedIn: (value: boolean) => void;
  setSessionId: (value: string | null) => void;
  setIsFirstLaunch: (value: boolean) => void;
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
      } catch (error) {
        console.error('앱 초기화 오류:', error);
      }
    };

    initializeApp();
  }, []);

  const handleSetSessionId = async (value: string | null) => {
    setSessionId(value);
    if (value) {
      await AsyncStorage.setItem('sessionId', value);
    } else {
      await AsyncStorage.removeItem('sessionId');
    }
  };

  const handleSetIsFirstLaunch = async (value: boolean) => {
    setIsFirstLaunch(value);
    if (!value) {
      await AsyncStorage.setItem('hasLaunched', 'true');
    }
  };

  const value: AppContextType = {
    isLoggedIn,
    sessionId,
    isFirstLaunch,
    setIsLoggedIn,
    setSessionId: handleSetSessionId,
    setIsFirstLaunch: handleSetIsFirstLaunch,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
