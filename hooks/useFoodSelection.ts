import { foodAPI } from '@/services/api';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { FoodItem } from './useFoodList';

export function useFoodSelection(sessionId: string | null, onRefresh: () => void) {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedFids, setSelectedFids] = useState<string[]>([]);

    const handleLongPress = useCallback((item: FoodItem) => {
        if (!isSelectionMode) {
            setIsSelectionMode(true);
            setSelectedFids([item.fid]);
        }
    }, [isSelectionMode]);

    const toggleSelection = useCallback((fid: string) => {
        setSelectedFids(prev => {
            if (prev.includes(fid)) {
                const newSelection = prev.filter(id => id !== fid);
                if (newSelection.length === 0) {
                    setIsSelectionMode(false); // Helper: exit selection mode if nothing selected? optional
                }
                return newSelection;
            }
            return [...prev, fid];
        });
    }, []);

    const selectAll = useCallback((items: FoodItem[]) => {
        if (selectedFids.length === items.length && items.length > 0) {
            setSelectedFids([]);
        } else {
            setSelectedFids(items.map(item => item.fid));
        }
    }, [selectedFids]);

    const handleDeleteSelected = useCallback(() => {
        if (!sessionId || selectedFids.length === 0) return;

        Alert.alert(
            '선택 삭제',
            `${selectedFids.length}개 식품을 삭제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await Promise.all(selectedFids.map(fid =>
                                foodAPI.deleteFood(sessionId, fid).catch(e => console.warn(`Failed to delete ${fid}`, e))
                            ));
                            onRefresh(); // Refresh list after deletion
                        } finally {
                            setSelectedFids([]);
                            setIsSelectionMode(false);
                        }
                    }
                }
            ]
        );
    }, [sessionId, selectedFids, onRefresh]);

    return {
        isSelectionMode,
        setIsSelectionMode,
        selectedFids,
        setSelectedFids,
        handleLongPress,
        toggleSelection,
        selectAll,
        handleDeleteSelected
    };
}
