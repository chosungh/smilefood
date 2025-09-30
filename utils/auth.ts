import { clearAuthData, loadAuthData, saveAuthData } from './storage';

export const authUtils = {
  // 세션 ID 저장
  saveSessionId: async (sid: string) => {
    try {
      await saveAuthData({ sessionId: sid, isLoggedIn: true });
      return true;
    } catch (error) {
      console.error('세션 ID 저장 실패:', error);
      return false;
    }
  },

  // 세션 ID 가져오기
  getSessionId: async () => {
    try {
      const authData = await loadAuthData();
      return authData.sessionId;
    } catch (error) {
      console.error('세션 ID 가져오기 실패:', error);
      return null;
    }
  },

  // 세션 ID 삭제 (로그아웃)
  removeSessionId: async () => {
    try {
      await saveAuthData({ sessionId: null, isLoggedIn: false });
      return true;
    } catch (error) {
      console.error('세션 ID 삭제 실패:', error);
      return false;
    }
  },

  // 로그인 상태 확인
  isLoggedIn: async () => {
    try {
      const authData = await loadAuthData();
      return authData.isLoggedIn && !!authData.sessionId;
    } catch (error) {
      console.error('로그인 상태 확인 실패:', error);
      return false;
    }
  },

  // 첫 실행 여부 확인
  isFirstRun: async () => {
    try {
      const authData = await loadAuthData();
      return authData.isFirstLaunch;
    } catch (error) {
      console.error('첫 실행 확인 실패:', error);
      return true;
    }
  },

  // 첫 실행 완료 표시
  setFirstRunComplete: async () => {
    try {
      await saveAuthData({ isFirstLaunch: false });
      return true;
    } catch (error) {
      console.error('첫 실행 완료 표시 실패:', error);
      return false;
    }
  },

  // 모든 인증 데이터 삭제 (완전 로그아웃)
  clearAllAuthData: async () => {
    try {
      await clearAuthData();
      return true;
    } catch (error) {
      console.error('모든 인증 데이터 삭제 실패:', error);
      return false;
    }
  },
};
