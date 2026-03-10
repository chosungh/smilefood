import { useAppContext } from '@/contexts/AppContext';
import { FoodItem as ApiFoodItem, authAPI, foodAPI } from '@/services/api';
import { preloadImages } from '@/utils/imageCache';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

// Define the extended FoodItem type here or import it if shared
export type FoodItem = ApiFoodItem & {
    days_remaining: number;
};

export function useFoodList() {
    const router = useRouter();
    const { sessionId, setSessionId, setUserInfo, setIsLoggedIn, setRefreshFoodList, showAlert, foodList, setFoodList } = useAppContext();
    const [refreshing, setRefreshing] = useState(false);
    const initialLoadDone = useRef(false);
    const appState = useRef<AppStateStatus>(AppState.currentState);

    const transformFoodItem = useCallback((apiFood: ApiFoodItem): FoodItem => {
        const expirationDate = new Date(apiFood.expiration_date);
        expirationDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = expirationDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
            ...apiFood,
            days_remaining: diffDays,
        };
    }, []);

    const checkSession = useCallback(async () => {
        if (!sessionId) return false;

        try {
            const sessionResponse = await authAPI.getSessionInfo(sessionId);

            if (sessionResponse.data.session_info.is_active === 0) {
                showAlert('세션 만료', '세션이 만료되었습니다. 다시 로그인하세요.');
                await setSessionId(null);
                await setUserInfo(null);
                await setIsLoggedIn(false);
                router.replace('/login');
                return false;
            }

            return true;
        } catch (error: any) {
            console.warn('Session check error:', error?.response || error);
            return false;
        }
    }, [sessionId, showAlert, setSessionId, setUserInfo, setIsLoggedIn, router]);

    const fetchFoodList = useCallback(async (isSilent = false) => {
        if (!sessionId) return;

        if (!isSilent) setRefreshing(true);
        try {
            const isSessionValid = await checkSession();
            if (!isSessionValid) {
                if (!isSilent) setRefreshing(false);
                return;
            }

            const response = await foodAPI.getFoodList(sessionId);
            if (response.code === 200) {
                const activeFoodList = response.data.food_list.filter((food) => food.is_active === 1);
                const transformedFoodList = activeFoodList.map(transformFoodItem);
                setFoodList(transformedFoodList);

                const imageUrls = activeFoodList
                    .slice(0, 20)
                    .map((food) => food.image_url)
                    .filter((url) => url && url.trim() !== '');
                preloadImages(imageUrls);
            }
        } catch (error: any) {
            if (!isSilent) console.warn('Food list refresh failed', error);
        } finally {
            if (!isSilent) setRefreshing(false);
        }
    }, [sessionId, transformFoodItem, checkSession, setFoodList]);

    const onRefresh = useCallback(() => {
        fetchFoodList(false);
    }, [fetchFoodList]);

    // Initial load
    useEffect(() => {
        if (sessionId && !initialLoadDone.current) {
            fetchFoodList(false);
            initialLoadDone.current = true;
        }
    }, [sessionId, fetchFoodList]);

    // App state change (background to foreground)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                if (sessionId) {
                    fetchFoodList(false);
                }
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [sessionId, fetchFoodList]);

    // Expose refresh function to Context
    useEffect(() => {
        setRefreshFoodList(() => onRefresh);
        return () => setRefreshFoodList(null);
    }, [onRefresh, setRefreshFoodList]);

    // Focus effect
    useFocusEffect(
        useCallback(() => {
            if (!refreshing && sessionId && initialLoadDone.current) {
                fetchFoodList(true);
            }
        }, [sessionId, refreshing, fetchFoodList])
    );

    return {
        foodList,
        refreshing,
        onRefresh,
        fetchFoodList
    };
}
