import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, BorderRadius } from '../styles/GlobalStyles';

interface SmileFoodLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
}

export default function SmileFoodLogo({ 
  size = 120, 
  showText = true,
  textColor = Colors.text.primary 
}: SmileFoodLogoProps) {
  const logoSize = size;
  const iconSize = size * 0.6;
  const textSize = size * 0.15;

  return (
    <View style={styles.container}>
      {/* 로고 아이콘 */}
      <View style={[
        styles.logoContainer, 
        { 
          width: logoSize, 
          height: logoSize,
          borderRadius: logoSize / 2,
        }
      ]}>
        {/* 음식 그릇 */}
        <View style={[
          styles.bowlContainer,
          {
            width: iconSize * 0.8,
            height: iconSize * 0.6,
            borderRadius: iconSize * 0.1,
          }
        ]}>
          {/* 음식 아이템들 */}
          <View style={styles.foodItems}>
            <Text style={[styles.foodEmoji, { fontSize: iconSize * 0.25 }]}>🥗</Text>
            <Text style={[styles.foodEmoji, { fontSize: iconSize * 0.2 }]}>🍎</Text>
            <Text style={[styles.foodEmoji, { fontSize: iconSize * 0.2 }]}>🥕</Text>
          </View>
        </View>
        
        {/* 웃는 얼굴 */}
        <View style={[
          styles.smileContainer,
          {
            width: iconSize * 0.9,
            height: iconSize * 0.45,
          }
        ]}>
          {/* 눈 */}
          <View style={styles.eyes}>
            <View style={[styles.eye, { 
              width: iconSize * 0.08, 
              height: iconSize * 0.08,
              borderRadius: iconSize * 0.04,
            }]} />
            <View style={[styles.eye, { 
              width: iconSize * 0.08, 
              height: iconSize * 0.08,
              borderRadius: iconSize * 0.04,
            }]} />
          </View>
          
          {/* 웃는 입 */}
          <View style={[
            styles.smile,
            {
              width: iconSize * 0.25,
              height: iconSize * 0.12,
              borderRadius: iconSize * 0.12,
              borderWidth: iconSize * 0.02,
            }
          ]} />
        </View>
      </View>
      
      {/* 앱 이름 */}
      {showText && (
        <Text style={[
          styles.logoText,
          { 
            fontSize: textSize,
            color: textColor,
            marginTop: size * 0.1,
          }
        ]}>
          SmileFood
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  bowlContainer: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: '15%',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  foodItems: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '90%',
  },
  foodEmoji: {
    textAlign: 'center',
  },
  smileContainer: {
    position: 'absolute',
    bottom: '15%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '40%',
    marginBottom: 8,
  },
  eye: {
    backgroundColor: Colors.white,
  },
  smile: {
    backgroundColor: 'transparent',
    borderColor: Colors.white,
    borderTopWidth: 0,
  },
  logoText: {
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
