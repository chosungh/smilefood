import { View, SafeAreaView, Alert, StyleSheet, Dimensions } from 'react-native'
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header'
import FoodViewList from './FoodViewList';
import MenuButtonAndModal from './MenuButton';

export default function Index(): JSX.Element {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{flex: 1, gap: Dimensions.get('window').width/10}}>
        <Header />
        <FoodViewList />
      </View>

      <MenuButtonAndModal />

      
    </SafeAreaView>
  );
}
