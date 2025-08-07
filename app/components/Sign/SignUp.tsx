import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet ,TouchableOpacity} from 'react-native';
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const SignupScreen = () => {

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  // 1단계: 이메일 인증 요청
  const handleSendVerification = async () => {
    const formData = new FormData();
    formData.append('email', email);

    try {
      const res = await fetch(`https://ggcg.szk.kr/user/send_email_verify_code`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (res.ok) {
        Alert.alert('이메일 전송 성공', '인증코드가 전송되었습니다.');
        setStep(2);
      } else {
        Alert.alert('실패', json.message || '이메일 전송 실패');
      }
    } catch (err) {
      Alert.alert('오류', '네트워크 오류');
    }
  };

  // 2단계: 인증 코드 확인
  const handleVerifyCode = async () => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('code', code);

    try {
      const res = await fetch(`https://ggcg.szk.kr/user/verify_code`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (res.ok) {
        Alert.alert('인증 성공', '계정 생성을 계속하세요.');
        setStep(3);
      } else {
        Alert.alert('인증 실패', json.message || '코드가 올바르지 않습니다.');
      }
    } catch (err) {
      Alert.alert('오류', '네트워크 오류');
    }
  };

  const handleCreateAccount = async () => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('name', name);

    try {
      const res = await fetch(`https://ggcg.szk.kr/user`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (res.ok) {
        Alert.alert('회원가입 성공', '이제 로그인 할 수 있습니다.');
      
      } else {
        Alert.alert('회원가입 실패', json.message || '계정 생성 실패');
      }
    } catch (err) {
      Alert.alert('오류', '네트워크 오류');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 20, gap: 20}}>
      <View style={{ width: '100%'}}>
        <TouchableOpacity onPress={() => router.back()}> 
            <Ionicons name='arrow-back' size={24}/>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>회원가입</Text>

      <View style={{gap: 16}}>

        <View style={{ gap: 20 }}>
          <TextInput
            style={styles.input}
            placeholder="이름"
            value={name}
            onChangeText={setName}
          />
              
          <TextInput
            style={styles.input}
            placeholder="이메일 입력"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={{
            width: '100%',
            alignSelf: 'stretch',
            justifyContent: 'flex-start',
            flexDirection: 'row',
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 5,
          }}>
            <TextInput
              style={{
                flex: 9,
                padding: 10,
                borderBottomRightRadius: 0,
                borderBottomLeftRadius: 0,
              }}
              placeholder="인증코드 입력"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={{flex: 1, backgroundColor: '#007AFF', padding: 10, borderRadius: 3, height: '100%'}} onPress={handleVerifyCode}>
              <Text style={styles.buttonText}>전송</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="비밀번호 (영문+숫자+기호, 8자 이상)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
              
          <TouchableOpacity style={styles.button} onPress={handleCreateAccount}>
            <Text style={styles.buttonText}>회원가입</Text>
          </TouchableOpacity>
            
          </View>
             
            <View style={{
              justifyContent: 'center', flexDirection: 'row', gap: 12, 
            }}>

              <TouchableOpacity onPress={() => router.push('/components/Sign/SignIn')}>
                <Text style={{color: '#007AFF', borderBottomWidth:1, borderColor: '#007AFF'}}>비밀번호 찾기</Text>
              </TouchableOpacity>
          
              <Text>/</Text>
          
              <TouchableOpacity onPress={() => router.push('/components/Sign/SignIn')}>
                <Text style={{color: '#007AFF', borderBottomWidth:1, borderColor: '#007AFF'}}>로그인</Text>
              </TouchableOpacity>
              </View>

          {/* <View style={{gap: 20}}>
            <Text>이메일: {email} (인증 완료)</Text>

          </View> */}
      </View>
      
      
    </SafeAreaView>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
  },
  button: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
});