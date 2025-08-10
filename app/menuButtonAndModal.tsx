import { Image, Modal, View, Text, Alert, TextInput, TouchableOpacity, Dimensions, StyleSheet, ScrollView } from 'react-native'
import { use, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router'
import { useAppContext } from '../contexts/AppContext';
import { authAPI } from '@/services/api';

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
};

const MenuButtonAndModal = () => {
    const [AimodalVisible, setAiModalVisible] = useState(false);
    const [BarcodemodalVisible, setBarcodeModalVisible] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [foodCount, setFoodCount] = useState('');
    const { sessionId } = useAppContext();
    const [foodList, setFoodList] = useState<FoodItem[]>([]);
    const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]); // 선택된 식품 ID 배열

    useEffect(() => {
        showFoodList();
    }, []);

    const handleCamera = () => {
        // 카메라 기능 구현 예정
        Alert.alert('카메라', '카메라 기능이 곧 구현됩니다.');
    };

    // 체크박스 토글 함수
    const toggleFoodSelection = (fid: string) => {
        setSelectedFoodIds(prev => {
        const isSelected = prev.includes(fid);
        
        if (isSelected) {
            // 이미 선택된 경우 제거
            return prev.filter(id => id !== fid);
        } else {
            // 선택되지 않은 경우
            if (prev.length >= 2) {
                // 이미 2개가 선택된 경우 알림
                Alert.alert('알림', '최대 2개까지 선택할 수 있습니다.');
                return prev;
            } else {
                // 추가
                return [...prev, fid];
            }
        }
        });
    };

    const FoodChat = async (fid1: string, fid2: string) => {
        try {
            if (sessionId && fid1 && fid2) {
                const response = await authAPI.FoodChat(sessionId, fid1, fid2);
            
                if (response.code === 200) {
                    Alert.alert('AI 추천 결과', response.message, [
                        { text: '확인' }
                    ]);
                } else {
                    console.log(response.message);
                }
            }
        } catch (error) {
            Alert.alert('오류', 'AI 추천을 불러오지 못했습니다.');
            console.error('AI 추천 오류:', error);
        }
    };

    const FoodCard = ({ item }: { item: FoodItem }) => {
        const cardHeight = Dimensions.get('window').height / 10;
        const isSelected = selectedFoodIds.includes(item.fid);
        
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
            <Image 
                source={{ uri: item.image_url }} 
                style={[
                    styles.foodImage,
                    { height: cardHeight - 20 }
                ]} 
            />
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
                const response = await authAPI.getFoodListInfo(sessionId); 
                
                if (response.code === 200) {
                    const foodList = response.data.food_list;
                    setFoodList(foodList);
                }
            }
        } catch (error) { }
    }               

    const AddFood = async () => {
        if (!sessionId || barcode === '') {
            return
        }

        try {
            const response = await authAPI.regiFood(sessionId, barcode, foodCount);

            if (response.code === 200) {
                Alert.alert('식품 추가 완료', response.message, [{ text: '확인' }])
            } else {
                console.log(response.message)
        }
        } catch (err) {
            Alert.alert('오류');
        }
    }

    //FoodInfo
    const GetFoodInfo = async (sid: string) => { 
        const formData = new FormData();
        formData.append("sid", sid);

        if (sid) {
            try {
                const res = await fetch(`https://ggcg.szk.kr/food`, {
                    method: '',
                    headers: {
                        'sid': String(formData.get('sid') ?? ''),
                        'fid': String(formData.get('fid') ?? ''),
                    }
                });
                const json = await res.json();
            } catch (error) {
                Alert.alert('오류', '식품 정보를 불러오지 못했습니다.');
            }
        }
  }

  // 선택된 식품들로 작업하는 함수 (FoodChat 실행)
  const handleSelectedFoods = async () => {
    if (selectedFoodIds.length === 0) {
        Alert.alert('알림', '식품을 선택해주세요.');
        return;
    }
    
    if (selectedFoodIds.length === 1) {
        Alert.alert('알림', 'AI 추천을 위해 2개의 식품을 선택해주세요.');
        return;
    }

    // 2개의 식품이 선택된 경우 FoodChat 함수 실행
    if (selectedFoodIds.length === 2) {
        const fid1 = selectedFoodIds[0];
        const fid2 = selectedFoodIds[1];
        
        console.log('AI 추천 요청:', { fid1, fid2 });
        
        // FoodChat 함수 실행
        await FoodChat(fid1, fid2);
        
        // 성공적으로 실행 후 모달 닫고 선택 초기화
        setAiModalVisible(false);
        setSelectedFoodIds([]);
    }
  };
 
  return (
    <View style={styles.ButtonListView}>
        {isOpen && (
            <TouchableOpacity style={styles.HiddenButton} onPress={() => handleCamera()}>
                <Ionicons name='scan-outline' size={32} />
            </TouchableOpacity>
        )}

        {isOpen && (
            <TouchableOpacity style={styles.HiddenButton} onPress={() => setBarcodeModalVisible(true)}>
                <Ionicons name='barcode-outline' size={32} />
            </TouchableOpacity>
        )}          

        {isOpen && (
            <TouchableOpacity style={styles.HiddenButton} onPress={() => setAiModalVisible(true)}>
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
                            선택된 식품: {selectedFoodIds.length}/2
                            </Text>
                        </View>
                    
                        <ScrollView style={styles.scrollView}>
                            {foodList.map((item) => (
                                <FoodCard key={item.fid} item={item} />
                            ))}
                        </ScrollView>

                        {/* 선택 완료 버튼 */}
                        {selectedFoodIds.length > 0 && (
                    
                            <TouchableOpacity 
                                style={styles.selectButton}
                                onPress={handleSelectedFoods}
                            >
                                <Text style={styles.ModalButtonText}>
                                    선택한 식품으로 작업하기
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

            <Modal
                visible={BarcodemodalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setBarcodeModalVisible(false)}
            >
                <View style={styles.barcodeModalBackground}>
                    <View style={styles.barcodeModalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setBarcodeModalVisible(false)}> 
                                <Ionicons name='arrow-back' size={24}/>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="식품 바코드 번호"
                            value={barcode ?? ''}
                            onChangeText={setBarcode}
                            keyboardType="number-pad"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="식품 갯수"
                            value={foodCount}
                            onChangeText={setFoodCount}
                            keyboardType="number-pad"
                        />

                        <TouchableOpacity style={styles.ModalButton} onPress={AddFood}>
                            <Text style={styles.ModalButtonText}>식품 추가</Text>
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
        backgroundColor: '#f9f9f9',
        marginBottom: 10,
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
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
        paddingTop: Dimensions.get('window').height/3,
        paddingBottom: Dimensions.get('window').height/3,
        paddingLeft: Dimensions.get('window').width/10,
        paddingRight: Dimensions.get('window').width/10
    },
    barcodeModalContent: {
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'center',
        backgroundColor: '#fff',
        height: '100%',
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
        backgroundColor: '#f0f8ff',
    },
    foodImage: {
        aspectRatio: 1,
        borderRadius: 6,
        marginRight: 12,
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
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#007aff',
        width: '100%',
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
  }
});