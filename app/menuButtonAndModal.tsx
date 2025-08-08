import { Modal, View, Text, Alert, TextInput, TouchableOpacity, Dimensions, StyleSheet } from 'react-native'
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router'
import { useAppContext } from '../contexts/AppContext';
import { authAPI } from '@/services/api';

const MenuButtonAndModal = () => {
    const [AimodalVisible, setAiModalVisible] = useState(false);
    const [BarcodemodalVisible, setBarcodeModalVisible] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [foodCount, setFoodCount] = useState('');
    const { sessionId } = useAppContext();

    const toggle = () => {
        setIsOpen(prev => !prev); 
    };

    const AddFood = async () => {
        if (!sessionId || barcode === '') {
            return
        }

        
        try {
            const response = await authAPI.regiFood(sessionId, barcode, foodCount);

            if (response.code === 200) {
                Alert.alert('식품 추가 완료', response.message, [
                    {
                        text: '확인'
                    }
                ])
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
            console.log(json);
    
          } catch (error) {
            Alert.alert('오류', '식품 정보를 불러오지 못했습니다.');
          }
        }
      }
 
    return (
        <View style={styles.ButtonListView}>

            {isOpen && (<TouchableOpacity style={styles.HiddenButton} onPress={() => router.push('/Camera')}>
                <Ionicons name='scan-outline' size={32} />
            </TouchableOpacity>)}

            {isOpen && (<TouchableOpacity style={styles.HiddenButton} onPress={() => setBarcodeModalVisible(true)}>
                <Ionicons name='barcode-outline' size={32} />
            </TouchableOpacity>)}          

            {isOpen && (<TouchableOpacity style={styles.HiddenButton} onPress={() => setAiModalVisible(true)}>
                <Ionicons name='chatbubble-outline' size={32} />
            </TouchableOpacity>)}

            <TouchableOpacity style={styles.ToggleButton} onPress={toggle}>
                {isOpen ? <Ionicons name='close-outline' size={40} /> : <Ionicons name='add-outline' size={40} />}
            </TouchableOpacity>
            
            <View>
                <Modal
                    visible={AimodalVisible}
                    transparent={true}
                    animationType="fade" // 'slide' 또는 'none'도 가능
                    onRequestClose={() => setAiModalVisible(false)} // Android back 버튼 대응
                >
                    <View style={styles.ModalBackgroundShade}>
                        <View style={styles.ModalBackground}>
                            <View style={{ position: 'absolute',top: 0, left: 0,width: '100%', padding: 20, zIndex: 20, borderRadius: 16}}>
                                <TouchableOpacity onPress={() => setAiModalVisible(false)}> 
                                    <Ionicons name='arrow-back' size={24}/>
                                </TouchableOpacity>                
                            </View>
                            
                            <View style={{ flex: 1 }}>
       
                            </View>
              
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={BarcodemodalVisible}
                    transparent={true}
                    animationType="fade" // 'slide' 또는 'none'도 가능
                    onRequestClose={() => setBarcodeModalVisible(false)} // Android back 버튼 대응
                >
                    <View style={styles.ModalBackgroundShade}>
                        <View style={{
                            flex: 1,
                            alignItems: 'stretch',
                            justifyContent: 'center',
                            borderRadius: 16,
                            width: '100%',
                            backgroundColor: 'white',
                            padding: 20,
                        }}>
                            <View style={{ position: 'absolute',top: 0, left: 0, width: '100%', padding: 20 }}>
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

                            <TouchableOpacity onPress={AddFood}>
                                <Text>식품 추가</Text>
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
    borderRadius: 5,
    padding: 10,
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
        padding: 20,
    }
})