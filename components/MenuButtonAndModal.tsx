import { useAppContext } from '@/contexts/AppContext';
import { foodAPI } from '@/services/api';
import { preloadImages } from '@/utils/imageCache';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type FoodItem = {
    barcode: string;
    count: number;
    created_at: string;
    description: string;
    expiration_date: string;
    expiration_date_desc: string;
    fid: string;
    image_url: string;
    name: string;
    type: string;
    uid: string;
    volume: string;
    is_active?: number;
};

const MenuButtonAndModal = () => {
    const router = useRouter();
    const [AimodalVisible, setAiModalVisible] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { sessionId } = useAppContext();
    const [foodList, setFoodList] = useState<FoodItem[]>([]);
    const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]);

    useEffect(() => {
        showFoodList();
    }, [sessionId]);

    const handleCamera = () => {
        router.push('/BarcodeScan');
    };

    const toggleFoodSelection = (fid: string) => {
        setSelectedFoodIds(prev => {
            const isSelected = prev.includes(fid);
            if (isSelected) {
                return prev.filter(id => id !== fid);
            } else {
                if (prev.length >= 10) {
                    Alert.alert('선택 제한', '최대 10개까지만 선택할 수 있습니다.');
                    return prev;
                }
                return [...prev, fid];
            }
        });
    };

    const FoodChat = async (fidList: string[]) => {
        try {
            if (sessionId && fidList.length > 0) {
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
            }
        } catch (error) {
            Alert.alert('오류', 'AI 추천을 불러오지 못했습니다.');
        }
    };

    const toggle = () => {
        setIsOpen(prev => !prev);
    };

    const showFoodList = async () => {
        try {
            if (sessionId) {
                const response = await foodAPI.getFoodList(sessionId);
                if (response.code === 200) {
                    const activeFoodList = response.data.food_list.filter((food: any) => food.is_active === 1);
                    setFoodList(activeFoodList);
                    const imageUrls = activeFoodList
                        .map(food => food.image_url)
                        .filter(url => url && url.trim() !== '');
                    preloadImages(imageUrls);
                }
            }
        } catch (error) { }
    }

    const handleSelectedFoods = async () => {
        if (selectedFoodIds.length < 2) {
            Alert.alert('알림', '2개 이상의 식품을 선택해주세요.');
            return;
        }
        await FoodChat(selectedFoodIds);
    };

    const FoodCard = ({ item }: { item: FoodItem }) => {
        const cardHeight = Dimensions.get('window').height / 10;
        const isSelected = selectedFoodIds.includes(item.fid);
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

        return (
            <TouchableOpacity
                className={`w-full flex-row border-b border-[#f4f4f4] pl-5 py-2.5 gap-2 ${isSelected ? 'bg-white' : ''}`}
                style={{ height: cardHeight }}
                activeOpacity={0.7}
                onPress={() => toggleFoodSelection(item.fid)}
            >
                <View className="relative mr-3 h-full justify-center">
                    {item.image_url && !imageError ? (
                        <Image
                            source={{ uri: item.image_url }}
                            style={{
                                height: cardHeight - 20,
                                aspectRatio: 1,
                                borderRadius: 6
                            }}
                            contentFit="cover"
                            transition={200}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            cachePolicy="memory-disk"
                        />
                    ) : (
                        <View className="bg-[#f8f9fa] justify-center items-center rounded-md" style={{ height: cardHeight - 20, aspectRatio: 1 }}>
                            <Text className="text-xl">📦</Text>
                        </View>
                    )}
                    {imageLoading && item.image_url && (
                        <View className="absolute inset-0 bg-white/80 justify-center items-center rounded-md" style={{ height: cardHeight - 20, aspectRatio: 1 }}>
                            <View className="w-4 h-4 border-2 border-[#007AFF] border-t-transparent rounded-full" />
                        </View>
                    )}
                </View>

                <View className="flex-1 justify-center">
                    <Text className="text-base font-bold text-[#333] mb-1">{item.name}</Text>
                    <Text className="text-sm text-[#666]">수량: {item.count}</Text>
                </View>

                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center self-center ml-2 mr-5 ${isSelected ? 'border-[#007AFF] bg-[#007AFF]' : 'border-[#ddd] bg-transparent'}`}>
                    {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="absolute bottom-10 right-5 z-10 items-center justify-center gap-3">
            {isOpen && (
                <TouchableOpacity
                    className="bg-white rounded-full p-3 shadow-md"
                    style={{ elevation: 5 }}
                    onPress={() => handleCamera()}
                >
                    <Ionicons name='barcode-outline' size={32} />
                </TouchableOpacity>
            )}

            {isOpen && (
                <TouchableOpacity
                    className="bg-white rounded-full p-3 shadow-md"
                    style={{ elevation: 5 }}
                    onPress={() => {
                        setAiModalVisible(true);
                        showFoodList();
                    }}
                >
                    <Ionicons name='chatbubble-outline' size={32} />
                </TouchableOpacity>
            )}

            <TouchableOpacity
                className="bg-white rounded-full p-4 shadow-md"
                style={{ elevation: 5 }}
                onPress={toggle}
            >
                {isOpen ? <Ionicons name='close-outline' size={40} /> : <Ionicons name='add-outline' size={40} />}
            </TouchableOpacity>

            <Modal
                visible={AimodalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setAiModalVisible(false)}
            >
                <View className="flex-1 items-center justify-center bg-black/60 pt-[100px] pb-20 px-10">
                    <View className="flex-1 w-full bg-white rounded-2xl py-5 shadow-md max-h-[80%]" style={{ elevation: 5 }}>
                        <View className="absolute top-0 left-0 w-full p-5 z-20 rounded-2xl">
                            <TouchableOpacity onPress={() => {
                                setAiModalVisible(false);
                                setSelectedFoodIds([]);
                            }}>
                                <Ionicons name='arrow-back' size={24} />
                            </TouchableOpacity>
                        </View>

                        <View className="mt-[60px] mb-[30px] px-5 items-center">
                            <Text className="text-lg font-bold text-[#333] text-center">
                                선택된 식품: {selectedFoodIds.length}개
                            </Text>
                        </View>

                        <ScrollView className="flex-1 w-full px-5">
                            {foodList.map((item) => (
                                <FoodCard key={item.fid} item={item} />
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            className={`mt-5 mx-5 rounded-xl py-2.5 px-5 items-center justify-center shadow-md ${selectedFoodIds.length < 2 ? 'bg-[#cccccc] shadow-none' : 'bg-[#007aff]'}`}
                            style={{ elevation: selectedFoodIds.length < 2 ? 0 : 5 }}
                            onPress={selectedFoodIds.length > 1 ? handleSelectedFoods : undefined}
                            disabled={selectedFoodIds.length < 2}
                        >
                            <Text className={`text-base font-semibold ${selectedFoodIds.length < 2 ? 'text-[#999]' : 'text-white'}`}>
                                {selectedFoodIds.length > 0 ? '레시피 추천' : '식품을 선택해주세요'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

export default MenuButtonAndModal;