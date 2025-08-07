import { useState, useEffect } from 'react';
import { View, Text, Image, Dimensions, ScrollView, TouchableOpacity, SafeAreaView, Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingPage = () => {
    const [sid, setSid] = useState<string | null>(null);

    useEffect(() => {
        const getSid = async () => {
            const storedSid = await AsyncStorage.getItem('sid');
            console.log('AsyncStorage에서 가져온 sid:', storedSid);
            setSid(storedSid);
        };
        getSid();
    },[]);
    
    const Logout = async () => {
        const formData = new FormData();

        if (sid) {
            formData.append("sid", sid);

            fetch("https://ggcg.szk.kr/session", {
            method: "DELETE",
            body: formData
            })
            .then((response) => response.json())
            .then((data) => {
                Alert.alert("서버 응답", data.message);
            })
            .catch((error) => {
                Alert.alert("에러 발생", error);
            });
        }
    }

    
    


    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView>
                <View style={{ width: '100%', padding: 20 }}>
                    <TouchableOpacity onPress={() => router.back()}> 
                        <Ionicons name='arrow-back' size={24}/>
                    </TouchableOpacity>
                </View>
                
                <View style={{ width:'100%', alignItems: 'center', gap : 20}}>
                    <Image source={{ uri: 'https://picsum.photos/400/200?random=1' }} style={{ width: Dimensions.get('window').width / 3, height: Dimensions.get('window').width / 3, borderRadius: 70 }} /> 
                    
                    <TouchableOpacity onPress={() => router.push('/components/Sign/SignIn')}>
                    <Text>로그인 / 회원가입</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={Logout}>
                    <Text>로그아웃</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            
        </SafeAreaView>
    )
}

export default SettingPage