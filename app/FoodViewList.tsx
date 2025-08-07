import { ScrollView, View, Text, Alert, TouchableOpacity, Dimensions } from 'react-native'
import React, { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const GetFoodInfo = async (sid: string, setViews: React.Dispatch<React.SetStateAction<any[]>>) => { 
    const formData = new FormData();
    formData.append("sid", sid);

    if (sid) {
      try {
        const res = await fetch(`https://ggcg.szk.kr/session`, {
          method: '',
          headers: {
            'sid': String(formData.get('sid') ?? ''),
          }
        });
        const json = await res.json();
        console.log(json);
        setViews(json); // Update views state with fetched data

      } catch (error) {
        Alert.alert('오류', '식품 정보를 불러오지 못했습니다.');
      }
    }
}
  
const FoodViewList = () => { 
  const [views, setViews] = useState<any[]>([
    { name: '사과', desc: '신선한 사과', color: 'red' },
    { name: '바나나', desc: '맛있는 바나나', color: 'yellow' },
    { name: '오렌지', desc: '상큼한 오렌지', color: 'orange' },
  ]);
  const [sid, setSid] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const loadSid = async () => {
      const storedSid = await AsyncStorage.getItem('sid');
      setSid(storedSid);
    };
    loadSid();
  }, []);

  const onScroll = (event: any) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / (width * 0.8));
    setCurrentIndex(page);
  };

  return (
    <View style={{ padding: 20,}}>
      <Text style={{fontSize: 24, fontWeight: 'bold'}}>우리집 식재료</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ marginTop: 16 }}
        contentContainerStyle={{ alignItems: 'center' }}
      >
        {views.map((item, idx) => (
          <View
            key={idx}
            style={{
              width: width * 0.8,
              height: Dimensions.get('screen').height/2,
              backgroundColor: 'gray',
              borderRadius: 16,
              marginRight: idx === views.length - 1 ? 0 : 16,
              justifyContent: 'flex-start',
              alignItems: 'center',
            }}
          >
            <View style={{ width: '100%', height: '75%', backgroundColor: item.color, borderRadius: 16 }}>
              {/* 여기에 이미지 또는 기타 컨텐츠 추가 가능 */}
            </View>
            <Text style={{ marginTop: 8, fontWeight: 'bold' }}>{item.name}</Text>
            <Text style={{ textAlign: 'center', paddingHorizontal: 10 }}>{item.desc}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
        {views.map((_, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => {
              setCurrentIndex(idx);
              scrollRef.current?.scrollTo({ x: idx * width * 0.8, animated: true });
            }}
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: currentIndex === idx ? 'black' : 'lightgray',
              marginHorizontal: 5,
            }}
          />
        ))}
      </View>
    </View>
  );
}

export default FoodViewList;