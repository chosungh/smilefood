import { useMemo, useState } from 'react';
import { FoodItem } from './useFoodList';

export type SortType = 'expiry' | 'name' | 'created';

export function useFoodFilter(foodList: FoodItem[]) {
    const [searchText, setSearchText] = useState('');
    const [sortType, setSortType] = useState<SortType>('expiry');

    const filteredFoodList = useMemo(() => {
        let result = [...foodList]; // Clone for immutability

        if (searchText) {
            const lowerSearch = searchText.toLowerCase();
            result = result.filter(item =>
                item.name.toLowerCase().includes(lowerSearch)
            );
        }

        // Sort mutates array, so we must sort the clone/filtered result
        return result.sort((a, b) => {
            if (sortType === 'expiry') {
                return a.days_remaining - b.days_remaining;
            } else if (sortType === 'name') {
                return a.name.localeCompare(b.name, 'ko');
            } else if (sortType === 'created') {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            return 0;
        });
    }, [foodList, searchText, sortType]);

    return {
        searchText,
        setSearchText,
        sortType,
        setSortType,
        filteredFoodList
    };
}
