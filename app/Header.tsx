import {Stack, useRouter, } from 'expo-router';
import { Modal, ScrollView, View, SafeAreaView, Text, Alert, TextInput, Image, TouchableOpacity, Dimensions, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage';

const Header = () => { 
    useEffect(() => {
    (async () => {
      const loadUserInfo = async () => {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        const storedName = await AsyncStorage.getItem('userName');
  
        if (storedEmail) setEmail(storedEmail);
        if (storedName) setName(storedName);
      };
      loadUserInfo();
    })();
    }
    );

    const [email, setEmail] = useState('');
    const [name, setName] = useState('');

    return (
        <View style={{ alignItems: 'stretch', justifyContent: 'space-between', padding: 20 }}>
      
            <View style={{ alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row' }}>
                <View style={{alignItems: 'center', flexDirection: 'row', gap: 20}}>
                    <Image source={{ uri: 'https://picsum.photos/400/200?random=1' }} style={{ width: Dimensions.get('window').width/8, height: Dimensions.get('window').width/8, borderRadius: 42 }} /> 
                    <View>
                        <Text>{name}</Text>
                        <Text>{email}</Text>
                    </View>
                </View>

                <TouchableOpacity onPress={() => router.push('/components/Set/Setting')}>
                    <Ionicons name='settings-outline' size={Dimensions.get('window').width/12} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default Header;