import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAppContext } from '../contexts/AppContext';

export default function Index() {
  const router = useRouter();
  const { isFirstLaunch, isLoggedIn } = useAppContext();

  useEffect(() => {
    // 상태에 따라 적절한 화면으로 리다이렉트
    if (isFirstLaunch) {
      router.replace('/onboarding');
    } else if (isLoggedIn) {
      router.replace('/main');
    } else {
      router.replace('/login');
    }
  }, [isFirstLaunch, isLoggedIn, router]);

  // 리다이렉트 중에는 빈 화면 표시
  return null;
}
