import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSetRecoilState } from 'recoil';
import { sidState } from '../../../src/states/sidState';
import { SafeAreaView } from 'react-native-safe-area-context';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const setSid = useSetRecoilState(sidState);
  
  async function getSessionInfo(sid: string) {
    try {
      const formData = new FormData();
      formData.append("sid", sid);
      console.log(formData)
      
      const res = await fetch(`https://ggcg.szk.kr/session`, {
        method: 'GET',
        headers: {
          'sid': sid,
        }
      })
      console.log(sid)
      const json = await res.json();;
      console.log('서버 응답 내용:', json);
  
      return res.ok ? json : null;
    } catch (error) {
      console.error('세션 정보 조회 오류:', error);
      return null;
    }
  };
 
  const handleLogin = async () => {
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const res = await fetch(`https://ggcg.szk.kr/session`, {
        method: 'POST',
        body: formData,
      });
        
      
        
      const data = await res.json();
      if (res.ok && data.data.sid) {
        Alert.alert('로그인 성공', data.data.message);

        await AsyncStorage.setItem('userEmail', email);
        console.log(data.data.sid)
        
        await AsyncStorage.setItem('sid', data.data.sid);
        setSid(data.data.sid); 
    
        const sessionList = await getSessionInfo(data.data.sid);
        
        if (sessionList) {
          console.log('세션 리스트 조회 성공:', sessionList);
        } else {
          console.log('세션 리스트 조회 실패: ', data.data.message);
        }
    
        router.replace('/');
      } else { Alert.alert('로그인 실패', data.data.message); }
    } catch (error) {
      console.log('네트워크 오류', String(error));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 20, gap: 20}}>
      <View style={{width: '100%',}}>
        <TouchableOpacity onPress={() => router.push('/')}> 
          <Ionicons name='arrow-back' size={24}/>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.title}>로그인</Text>
      
      <View>
        <TextInput
          style={styles.input}
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>로그인</Text>
      </TouchableOpacity>

      <View style={{
        justifyContent: 'flex-start', flexDirection: 'row', gap: 12,
      }}>
        <Text>아직 회원이 아니신가요?</Text>
        <TouchableOpacity onPress={() => router.push('/components/Sign/SignUp')}>
          <Text style={{color: '#007AFF', borderBottomWidth:1, borderColor: '#007AFF'}}>회원가입</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SignIn;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
});