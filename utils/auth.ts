import AsyncStorage from '@react-native-async-storage/async-storage';

export const authUtils = {
  // 세션 ID 저장
  saveSessionId: async (sid: string) => {
    try {
      await AsyncStorage.setItem('sid', sid);
      return true;
    } catch (error) {
      console.error('세션 ID 저장 실패:', error);
      return false;
    }
  },

  // 세션 ID 가져오기
  getSessionId: async () => {
    try {
      return await AsyncStorage.getItem('sid');
    } catch (error) {
      console.error('세션 ID 가져오기 실패:', error);
      return null;
    }
  },

  // 세션 ID 삭제 (로그아웃)
  removeSessionId: async () => {
    try {
      await AsyncStorage.removeItem('sid');
      return true;
    } catch (error) {
      console.error('세션 ID 삭제 실패:', error);
      return false;
    }
  },

  // 로그인 상태 확인
  isLoggedIn: async () => {
    try {
      const sid = await AsyncStorage.getItem('sid');
      return !!sid;
    } catch (error) {
      console.error('로그인 상태 확인 실패:', error);
      return false;
    }
  },

  // 첫 실행 여부 확인
  isFirstRun: async () => {
    try {
      const hasRun = await AsyncStorage.getItem('hasRun');
      return !hasRun;
    } catch (error) {
      console.error('첫 실행 확인 실패:', error);
      return true;
    }
  },

  // 첫 실행 완료 표시
  setFirstRunComplete: async () => {
    try {
      await AsyncStorage.setItem('hasRun', 'true');
      return true;
    } catch (error) {
      console.error('첫 실행 완료 표시 실패:', error);
      return false;
    }
  },
};
