import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChatInput = ({ onSubmit }: { onSubmit: (text: string) => void }) => {
  const [text, setText] = useState<string>(''); 

  const SubmitChat = () => {
    const trimmed = text.trim();
    if (trimmed !== '') {
      onSubmit(trimmed);    
      setText('');          
    }
  };

  return (
    <View style={{
      padding: 20,
      width: '100%',
      height: 94,
      backgroundColor: 'white',
    }}>
      <View style={{
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
        <TextInput
          placeholder="식품명을 입력해주세요"
          value={text}                
          onChangeText={setText}    
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            borderColor: 'gray',
            borderRadius: 12,
            borderWidth: 1,
            paddingHorizontal: 10,
          }}
        />
        <TouchableOpacity
          onPress={SubmitChat}
          style={{
            height: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 8,
          }}>
          <Ionicons name='send' size={24} color={'black'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatInput;