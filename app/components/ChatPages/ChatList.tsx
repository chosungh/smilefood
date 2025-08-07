import React from 'react';
import { View, Text } from 'react-native';

const ChatList = ({ messages }: { messages: { sender: 'user' | 'ai'; text: string }[] }) => {
  return (
    <View
      style={{
        width: '100%',
        padding: 16,
        backgroundColor: 'white'
      }}>
      {messages.map((msg, index) => (
        <View
          key={index}
          style={{
            backgroundColor: msg.sender === 'user' ? '#dbeafe' : '#f0f0f0',
            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            padding: 12,
            borderRadius: 8,
            marginBottom: 8,
            maxWidth: '80%',
          }}>
          <Text style={{ fontSize: 16 }}>{msg.text}</Text>
        </View>
      ))}
    </View>
  );
};

export default ChatList;