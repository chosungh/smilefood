import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';

export default function Index() {
  const router = useRouter();
  const { isFirstLaunch, isLoggedIn, isAppInitialized } = useAppContext();

  useEffect(() => {
    // 초기화 완료 이전에는 라우팅하지 않음
    if (!isAppInitialized) return;

    // 상태에 따라 적절한 화면으로 리다이렉트
    if (isFirstLaunch) {
      router.replace('/onboarding');
    } else if (isLoggedIn) {
      router.replace('/main');
    } else {
      router.replace('/login');
    }
  }, [isFirstLaunch, isLoggedIn, isAppInitialized, router]);

  // 리다이렉트 중에는 빈 화면 표시
  return null;
}
