import { foodAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Keyboard, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import { preloadImages } from '../utils/imageCache';


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
    const [BarcodemodalVisible, setBarcodeModalVisible] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [foodCount, setFoodCount] = useState('1');
    const [isAddingFood, setIsAddingFood] = useState(false);
    const { sessionId, refreshFoodList } = useAppContext();
    const [foodList, setFoodList] = useState<FoodItem[]>([]);
    const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]); // 선택된 식품 ID 배열

    useEffect(() => {
        showFoodList();
    }, [sessionId]);

    const handleCamera = () => {
        router.push('/BarcodeScan');
    };

    // 체크박스 토글 함수 (최대 10개 제한)
    const toggleFoodSelection = (fid: string) => {
        setSelectedFoodIds(prev => {
        const isSelected = prev.includes(fid);
        
        if (isSelected) {
            // 이미 선택된 경우 제거
            return prev.filter(id => id !== fid);
        } else {
            // 선택되지 않은 경우 - 최대 10개까지만 추가 가능
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
                    // 모달 닫기 및 선택 초기화 후 상세 페이지로 이동
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
            style={[
                styles.foodCard,
                { height: cardHeight },
                isSelected && styles.foodCardSelected
            ]}
            activeOpacity={0.7}
            onPress={() => toggleFoodSelection(item.fid)}
        >
            <View style={styles.imageContainer}>
                {item.image_url && !imageError ? (
                    <Image 
                        source={{ uri: item.image_url }} 
                        style={[
                            styles.foodImage,
                            { height: cardHeight - 20 }
                        ]} 
                        contentFit="cover"
                        transition={200}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        cachePolicy="memory-disk"
                    />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>📦</Text>
                    </View>
                )}
                {imageLoading && item.image_url && (
                    <View style={styles.loadingOverlay}>
                        <View style={styles.loadingSpinner} />
                    </View>
                )}
            </View>
            <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodCount}>수량: {item.count}</Text>
            </View>
            
            {/* 체크박스 */}
            <View style={[
                styles.checkbox,
                isSelected && styles.checkboxSelected
            ]}>
                {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                )}
            </View>
        </TouchableOpacity>
        );
    };

    const toggle = () => {
        setIsOpen(prev => !prev); 
    };

    const showFoodList = async () => {
        try {
            if (sessionId) {
                const response = await foodAPI.getFoodList(sessionId); 
                
                if (response.code === 200) {
                    // 활성화된(삭제되지 않은) 식품만 노출
                    const activeFoodList = response.data.food_list.filter((food: any) => food.is_active === 1);
                    setFoodList(activeFoodList);
                    // 이미지 프리로딩 (활성 항목만)
                    const imageUrls = activeFoodList
                        .map(food => food.image_url)
                        .filter(url => url && url.trim() !== '');
                    preloadImages(imageUrls);
                }
            }
        } catch (error) { }
    }               

        const AddFood = async () => {
        if (!sessionId || barcode === '') {
            Alert.alert('알림', '바코드를 입력해주세요.');
            return;
        }

        if (!foodCount || parseInt(foodCount) < 1 || parseInt(foodCount) > 999) {
            Alert.alert('알림', '식품 수량을 1~999 사이로 입력해주세요.');
            return;
        }

        setIsAddingFood(true);

        try {
            const response = await foodAPI.regiFood(sessionId, barcode, foodCount);

            if (response.code === 200) {
                Alert.alert('식품 추가 완료', response.message, [{ text: '확인' }]);
                // 성공 후 입력값 초기화
                setBarcode('');
                setFoodCount('1');
                setBarcodeModalVisible(false);
                
                // 메인화면의 식품 리스트 새로고침
                if (refreshFoodList) {
                    refreshFoodList();
                }
            } else {
                Alert.alert('오류', response.message);
            }
        } catch (error: any) {
            Alert.alert('오류', error.response?.data?.message || '식품 추가에 실패했습니다.');
        } finally {
            setIsAddingFood(false);
        }
    }

  // 선택된 식품들로 작업하는 함수 (FoodChat 실행)
  const handleSelectedFoods = async () => {
    if (selectedFoodIds.length < 2) {
        Alert.alert('알림', '2개 이상의 식품을 선택해주세요.');
        return;
    }

    // FoodChat 함수 실행
    await FoodChat(selectedFoodIds);
    
    // 성공적으로 실행 후 모달 닫고 선택 초기화
    setAiModalVisible(false);
    setSelectedFoodIds([]);
  };
 
  return (
    <View style={styles.ButtonListView}>
        {isOpen && (
            <TouchableOpacity style={styles.HiddenButton} onPress={() => handleCamera()}>
                <Ionicons name='barcode-outline' size={32} />
            </TouchableOpacity>
        )}

        {isOpen && (
            <TouchableOpacity style={styles.HiddenButton} onPress={() => setBarcodeModalVisible(true)}>
                <Ionicons name='create-outline' size={32} />
            </TouchableOpacity>
        )}

        {isOpen && (
            <TouchableOpacity style={styles.HiddenButton} onPress={() => {
                setAiModalVisible(true);
                showFoodList(); // AI 모달 열 때 식품 리스트 새로고침
            }}>
                <Ionicons name='chatbubble-outline' size={32} />
            </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.ToggleButton} onPress={toggle}>
            {isOpen ? <Ionicons name='close-outline' size={40} /> : <Ionicons name='add-outline' size={40} />}
        </TouchableOpacity>
      
        <View>
            <Modal
                visible={AimodalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setAiModalVisible(false)}
            >
                <View style={styles.ModalBackgroundShade}>
                    <View style={styles.ModalBackground}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => {
                                setAiModalVisible(false);
                                setSelectedFoodIds([]); // 모달 닫을 때 선택 초기화
                            }}> 
                                <Ionicons name='arrow-back' size={24} />
                            </TouchableOpacity>     
                        </View>

                        {/* 선택된 개수 표시 */}
                        <View>
                            <Text style={styles.selectedCountText}>
                            선택된 식품: {selectedFoodIds.length}개
                            </Text>
                        </View>
                    
                        <ScrollView style={styles.scrollView}>
                            {foodList.map((item) => (
                                <FoodCard key={item.fid} item={item} />
                            ))}
                        </ScrollView>

                        {/* 선택 완료 버튼 */}
                        <TouchableOpacity 
                            style={[
                                styles.selectButton,
                                selectedFoodIds.length < 2 && styles.selectButtonDisabled
                            ]}
                            onPress={selectedFoodIds.length > 1 ? handleSelectedFoods : undefined}
                            disabled={selectedFoodIds.length < 2}
                        >
                            <Text style={[
                                styles.ModalButtonText,
                                selectedFoodIds.length < 2 && styles.ModalButtonTextDisabled
                            ]}>
                                {selectedFoodIds.length > 0 ? '레시피 추천' : '식품을 선택해주세요'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={BarcodemodalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setBarcodeModalVisible(false)}
            >
                <View style={styles.ModalBackgroundShade}>
                    <View style={styles.barcodeModalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setBarcodeModalVisible(false)}> 
                                <Ionicons name='arrow-back' size={24}/>
                            </TouchableOpacity>
                        </View>

                        {/* 타이틀 추가 */}
                        <View style={styles.modalTitleContainer}>
                            <Text style={styles.modalTitle}>식품 수동 등록</Text>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="식품 바코드 번호"
                            placeholderTextColor="#999"
                            value={barcode ?? ''}
                            onChangeText={setBarcode}
                            keyboardType="number-pad"
                            onSubmitEditing={() => {
                                // 키보드 닫기
                                Keyboard.dismiss();
                            }}
                            blurOnSubmit={true}
                            returnKeyType="done"
                        />

                        <View style={styles.quantityContainer}>
                            <Text style={styles.quantityLabel}>식품 수량</Text>
                            <View style={styles.quantityControls}>
                                <TouchableOpacity 
                                    style={styles.quantityButton}
                                    onPress={() => {
                                        const current = parseInt(foodCount) || 1;
                                        if (current > 1) {
                                            setFoodCount(String(current - 1));
                                        }
                                    }}
                                    disabled={isAddingFood}
                                >
                                    <Ionicons name="remove" size={20} color="#007aff" />
                                </TouchableOpacity>
                                
                                <Text style={styles.quantityValue}>{foodCount}</Text>
                                
                                <TouchableOpacity 
                                    style={styles.quantityButton}
                                    onPress={() => {
                                        const current = parseInt(foodCount) || 1;
                                        if (current < 999) {
                                            setFoodCount(String(current + 1));
                                        }
                                    }}
                                    disabled={isAddingFood}
                                >
                                    <Ionicons name="add" size={20} color="#007aff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[
                                styles.ModalButton,
                                isAddingFood && styles.ModalButtonDisabled
                            ]} 
                            onPress={AddFood}
                            disabled={isAddingFood}
                        >
                            <Text style={[
                                styles.ModalButtonText,
                                isAddingFood && styles.ModalButtonTextDisabled
                            ]}>
                                {isAddingFood ? '추가 중...' : '식품 추가'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    </View>
  );
}

export default MenuButtonAndModal;

const styles = StyleSheet.create({
    HiddenButton: {
        backgroundColor: '#fff',
        borderRadius: 50,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 20,
        color: '#333',
        minHeight: 50,
    },
    ButtonListView: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 10,
        width: 'auto',
        height: 'auto',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    ToggleButton: {
        backgroundColor: '#fff',
        borderRadius: 50,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    ModalBackgroundShade: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingTop: 100,
        paddingBottom: 80,
        paddingLeft: 40,
        paddingRight: 40
    },
    ModalBackground: {
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'center',
        borderRadius: 16,
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        paddingBottom: 20,
        paddingTop: 20,

    shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3.84,
        elevation: 5,
        maxHeight: '80%',
    },
    modalHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        padding: 20,
        zIndex: 20,
        borderRadius: 16
    },
    modalTitleContainer: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 30,
        paddingLeft: 20,
        paddingRight: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        width: '100%',
    },
    selectedCountText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    scrollView: {
        width: '100%',
        flex: 1,
        padding: 20,
    },
    selectButton: {
        marginTop: 20,
        marginLeft: 20,
        marginRight: 20,
        backgroundColor: '#007aff',
        borderRadius: 12,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    selectButtonDisabled: {
        backgroundColor: '#cccccc',
        shadowOpacity: 0.05,
        elevation: 2,
    },
    selectButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    barcodeModalBackground: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    barcodeModalContent: {
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        backgroundColor: '#fff',
        width: '100%',
        margin: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3.84,
        elevation: 5,
        maxHeight: '80%',
    },
  addFoodButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        width: '100%',
        backgroundColor: '#007AFF',
        padding: 8,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ModalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    ModalButtonTextDisabled: {
        color: '#999999',
    },
    foodCard: {
        width: '100%',
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f4f4f4',
        paddingLeft: 20,
        paddingTop: 10,
        paddingBottom: 10,
        gap: 8,
    },
    foodCardSelected: {
        backgroundColor: '#ffffff',
    },
    imageContainer: {
        position: 'relative',
        marginRight: 12,
    },
    foodImage: {
        aspectRatio: 1,
        borderRadius: 6,
    },
    placeholderImage: {
        aspectRatio: 1,
        borderRadius: 6,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 20,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
    },
    loadingSpinner: {
        width: 16,
        height: 16,
        borderWidth: 2,
        borderColor: '#007AFF',
        borderTopColor: 'transparent',
        borderRadius: 8,
    },
    foodInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    foodName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    foodCount: {
        fontSize: 14,
        color: '#666',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ddd',
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginLeft: 8,
        marginRight: 20
    },
    checkboxSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#007AFF',
    },
    ModalButton: {
        backgroundColor: '#007aff',
        width: '100%',
        borderRadius: 12,
        paddingTop: 15,
        paddingBottom: 15,
        paddingLeft: 20,
        paddingRight: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        marginTop: 20,
    },
    ModalButtonDisabled: {
        backgroundColor: '#cccccc',
        shadowOpacity: 0.05,
        elevation: 2,
    },
    quantityContainer: {
        marginBottom: 20,
    },
    quantityLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    quantityButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#007aff',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        minWidth: 60,
        textAlign: 'center',
    }
});