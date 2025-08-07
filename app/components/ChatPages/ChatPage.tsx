import React from 'react';
import {useEffect, useState} from 'react';
import styled, { css } from '@emotion/native';
import {Stack, useRouter} from 'expo-router';
import {View, Text, TextInput, TouchableOpacity} from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import ChatInput from './Input';
import ChatList from './ChatList';
import { ScrollView } from 'react-native-gesture-handler';

export default function ChatPage() {
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const sendMessageToServer = async (message: string) => {
    try {
      const res = await fetch('http://192.168.10.134:3000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      console.log('응답:', data.reply);
      return data.reply;
    } catch (error) {
      console.error('서버 오류:', error);
      return '오류가 발생했어요.';
    }
  };
  return (
    <>
      <Stack.Screen options={{headerShown: true}} />
      <View style={{backgroundColor: 'white', alignContent: 'space-between',}}>
        <ChatList messages={messages} />
      </View>
      <View style={{
        backgroundColor: 'white',
      }}>
       <ChatInput
        onSubmit={async (text) => {
          const reply = await sendMessageToServer(text);
          setMessages(prev => [
            ...prev,
            { sender: 'user', text },
            { sender: 'ai', text: reply },
          ]);
        }}
      />
      </View>
    </>
  );
}
