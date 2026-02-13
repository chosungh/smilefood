import Button from '@/components/Button';
import { useAppContext } from '@/contexts/AppContext';
import { FoodItem, foodAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Modal,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';

// --- FoodCard 컴포넌트 (외부 분리로 불필요한 리마운트 방지) ---

interface FoodCardProps {
    item: FoodItem;
    isSelected: boolean;
    cardHeight: number;
    onToggle: (fid: string) => void;
}

const FoodCard = React.memo(({ item, isSelected, cardHeight, onToggle }: FoodCardProps) => {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const handleImageLoad = () => {
        setImageLoading(false);
        setImageError(false);
    };

    const handleImageError = () => {
        setImageLoading(false);
        setImageError(true);
    };

    const imageSize = cardHeight - 20;

    return (
        <TouchableOpacity
            className={`w-full flex-row border-b border-[#f4f4f4] pl-5 py-2.5 gap-2 ${isSelected ? 'bg-white' : ''}`}
            style={{ height: cardHeight }}
            activeOpacity={0.7}
            onPress={() => onToggle(item.fid)}
        >
            {/* 식품 이미지 */}
            <View className="relative mr-3 h-full justify-center">
                {item.image_url && !imageError ? (
                    <Image
                        source={{ uri: item.image_url }}
                        style={{
                            height: imageSize,
                            aspectRatio: 1,
                            borderRadius: 6,
                        }}
                        contentFit="cover"
                        transition={200}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        cachePolicy="memory-disk"
                    />
                ) : (
                    <View
                        className="bg-[#f8f9fa] justify-center items-center rounded-md"
                        style={{ height: imageSize, aspectRatio: 1 }}
                    >
                        <Text className="text-xl">📦</Text>
                    </View>
                )}
                {imageLoading && item.image_url && !imageError && (
                    <View
                        className="absolute inset-0 bg-white/80 justify-center items-center rounded-md"
                        style={{ height: imageSize, aspectRatio: 1 }}
                    >
                        <ActivityIndicator size="small" color="#007AFF" />
                    </View>
                )}
            </View>

            {/* 식품 정보 */}
            <View className="flex-1 justify-center">
                <Text className="text-base font-bold text-[#333] mb-1">{item.name}</Text>
                <Text className="text-sm text-[#666]">수량: {item.count}</Text>
            </View>

            {/* 선택 체크박스 */}
            <View
                className={`w-6 h-6 rounded-full border-2 items-center justify-center self-center ml-2 mr-5 ${isSelected ? 'border-[#007AFF] bg-[#007AFF]' : 'border-[#ddd] bg-transparent'
                    }`}
            >
                {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
        </TouchableOpacity>
    );
});

// --- MenuButtonAndModal 메인 컴포넌트 ---

interface MenuButtonAndModalProps {
    foodList: FoodItem[];
}

const MenuButtonAndModal = ({ foodList }: MenuButtonAndModalProps) => {
    const router = useRouter();
    const { height: windowHeight } = useWindowDimensions();
    const { sessionId } = useAppContext();

    const [aiModalVisible, setAiModalVisible] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    // const [foodList, setFoodList] = useState<FoodItem[]>([]); // Removed internal state
    const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]);
    const [isRequesting, setIsRequesting] = useState(false);

    // FAB 애니메이션
    const animationValue = useRef(new Animated.Value(0)).current;

    const cardHeight = windowHeight / 10;

    // 식품 목록 조회 로직 제거 (부모로부터 props로 받음)

    // 바코드 스캔 화면 이동
    const handleCamera = () => {
        router.push('/BarcodeScan');
    };

    // 식품 선택/해제 토글
    const toggleFoodSelection = useCallback((fid: string) => {
        setSelectedFoodIds((prev) => {
            if (prev.includes(fid)) {
                return prev.filter((id) => id !== fid);
            }
            if (prev.length >= 10) {
                Alert.alert('선택 제한', '최대 10개까지만 선택할 수 있습니다.');
                return prev;
            }
            return [...prev, fid];
        });
    }, []);

    // AI 레시피 채팅 요청
    const startFoodChat = async (fidList: string[]) => {
        try {
            if (!sessionId || fidList.length === 0) return;

            const response = await foodAPI.requestFoodChat(sessionId, fidList);
            if (response.code === 200) {
                const fcid = response.data.chat_info.fcid;
                setAiModalVisible(false);
                setSelectedFoodIds([]);
                if (fcid) {
                    router.push(`/chat-detail?fcid=${fcid}`);
                } else {
                    Alert.alert('오류', '레시피 상세 정보를 불러올 수 없습니다.');
                }
            } else {
                Alert.alert('오류', response.message);
            }
        } catch (error) {
            Alert.alert('오류', 'AI 추천을 불러오지 못했습니다.');
        }
    };

    // 선택된 식품으로 레시피 추천 요청
    const handleSelectedFoods = async () => {
        if (selectedFoodIds.length < 2) {
            Alert.alert('알림', '2개 이상의 식품을 선택해주세요.');
            return;
        }
        if (isRequesting) return;

        setIsRequesting(true);
        try {
            await startFoodChat(selectedFoodIds);
        } finally {
            setIsRequesting(false);
        }
    };

    // FAB 메뉴 토글 (애니메이션 포함)
    const toggleMenu = () => {
        const toValue = isOpen ? 0 : 1;
        setIsOpen((prev) => !prev);
        Animated.spring(animationValue, {
            toValue,
            useNativeDriver: true,
            friction: 6,
            tension: 60,
        }).start();
    };

    // 메인 버튼 아이콘 회전 (0° → 45°)
    const rotateInterpolate = animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    // 서브 버튼 공통 애니메이션 스타일 생성
    const getSubButtonStyle = (index: number) => {
        // index: 0이 가장 위 (바코드), 1이 AI 채팅
        const translateY = animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [40 * (2 - index), 0],
        });
        const opacity = animationValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1],
        });
        const scale = animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
        });
        return {
            transform: [{ translateY }, { scale }],
            opacity,
        };
    };

    // 모달 열기/닫기
    const openModal = () => {
        setAiModalVisible(true);
        // fetchFoodList(); // Removed redundant fetch
    };

    const closeModal = () => {
        setAiModalVisible(false);
        setSelectedFoodIds([]);
    };

    // FlatList renderItem
    const renderFoodCard = useCallback(
        ({ item }: { item: FoodItem }) => (
            <FoodCard
                item={item}
                isSelected={selectedFoodIds.includes(item.fid)}
                cardHeight={cardHeight}
                onToggle={toggleFoodSelection}
            />
        ),
        [selectedFoodIds, cardHeight, toggleFoodSelection]
    );

    const keyExtractor = useCallback((item: FoodItem) => item.fid, []);

    const isSubmitDisabled = selectedFoodIds.length < 2;

    return (
        <View className="absolute bottom-10 right-5 z-10 items-center justify-center gap-3">
            {/* 바코드 스캔 버튼 */}
            <Animated.View style={getSubButtonStyle(0)} pointerEvents={isOpen ? 'auto' : 'none'}>
                <TouchableOpacity
                    className="bg-white rounded-full p-3 border border-[#007AFF]"
                    style={{ elevation: 5 }}
                    onPress={handleCamera}
                >
                    <Ionicons name="barcode-outline" size={32} color="#007AFF" />
                </TouchableOpacity>
            </Animated.View>

            {/* AI 레시피 추천 버튼 */}
            <Animated.View style={getSubButtonStyle(1)} pointerEvents={isOpen ? 'auto' : 'none'}>
                <TouchableOpacity
                    className="bg-white rounded-full p-3 border border-[#007AFF]"
                    style={{ elevation: 5 }}
                    onPress={openModal}
                >
                    <Ionicons name="chatbubble-outline" size={32} color="#007AFF" />
                </TouchableOpacity>
            </Animated.View>

            {/* 메인 토글 버튼 */}
            <TouchableOpacity
                className="bg-[#007AFF] rounded-full p-4"
                style={{ elevation: 5 }}
                onPress={toggleMenu}
                activeOpacity={0.8}
            >
                <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                    <Ionicons name="add-outline" size={40} color="#fff" />
                </Animated.View>
            </TouchableOpacity>

            {/* 식품 선택 모달 */}
            <Modal
                visible={aiModalVisible}
                transparent
                animationType="fade"
                onRequestClose={closeModal}
            >
                <View className="flex-1 items-center justify-center bg-black/60 pt-[100px] pb-20 px-10">
                    <View
                        className="flex-1 w-full bg-white rounded-2xl py-5 max-h-[80%]"
                        style={{ elevation: 5 }}
                    >
                        {/* 모달 헤더 */}
                        <View className="flex-row items-center px-5 py-4 mb-2">
                            <TouchableOpacity onPress={closeModal}>
                                <Ionicons name="arrow-back" size={24} />
                            </TouchableOpacity>
                            <Text className="flex-1 text-lg font-bold text-[#333] text-center">
                                선택된 식품: {selectedFoodIds.length}개
                            </Text>
                        </View>

                        {/* 식품 목록 (FlatList로 가상화 적용) */}
                        <FlatList
                            className="flex-1 w-full px-5"
                            data={foodList}
                            keyExtractor={keyExtractor}
                            renderItem={renderFoodCard}
                            showsVerticalScrollIndicator={false}
                        />

                        {/* 레시피 추천 버튼 */}
                        <Button
                            title={selectedFoodIds.length > 0 ? '레시피 추천' : '식품을 선택해주세요'}
                            onPress={handleSelectedFoods}
                            isLoading={isRequesting}
                            disabled={isSubmitDisabled}
                            className="mt-5 mx-5"
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default MenuButtonAndModal;