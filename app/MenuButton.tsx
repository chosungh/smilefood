import { Modal, View, Text, Alert, TextInput, TouchableOpacity, Dimensions, StyleSheet } from 'react-native'
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router'
import ChatPage from './components/ChatPages/ChatPage';


const MenuButtonAndModal = () => {
    const [AimodalVisible, setAiModalVisible] = useState(false);
    const [BarcodemodalVisible, setBarcodeModalVisible] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [fid, setFid] = useState<string | null>(null);
    const [sid, setSid] = useState<string | null>(null);
    const [foodCount, setFoodCount] = useState('');

    useEffect(() => {
        const getSid = async () => {
            const storedSid = await AsyncStorage.getItem('sid');
            setSid(storedSid);
        };
        getSid();
    }, []);

    const toggle = () => {
        setIsOpen(prev => !prev); 
    };

    const AddFood = async (sid: string) => {
    const formData = new FormData;
    if (sid) {
      formData.append("sid", sid);
      formData.append("barcode", fid ?? '');
      formData.append("count", foodCount);
      console.log(formData);

      try {
        const res = await fetch(`https://ggcg.szk.kr/food`, {
          method: 'POST',
          body: formData,
        })
        const json = await res.json();
        formData.append("fid", json.data.food_info.fid)
        console.log(formData)
        
        if (res.ok) {
          Alert.alert('성공', json.message);

        } else {
          alert('실패');
        }
      } catch (err) {
        Alert.alert('오류');
        }
  
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
                                <ChatPage />
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
                                value={fid ?? ''}
                                onChangeText={setFid}
                                keyboardType="number-pad"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="식품 갯수"
                                value={foodCount}
                                onChangeText={setFoodCount}
                                keyboardType="number-pad"
                            />

                            <TouchableOpacity onPress={() => { if (sid) GetFoodInfo(sid); else Alert.alert('오류', '세션 정보가 없습니다.'); }}>
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
    padding: 12,
    borderRadius: 50,
    backgroundColor: 'white',
    borderColor: '#c5c5c5',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
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
        padding: 10,
        borderRadius: 50,
        backgroundColor: 'white',
        width: Dimensions.get('window').width / 6,
        height: Dimensions.get('window').width / 6,
        borderColor: '#c5c5c5',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center'
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
