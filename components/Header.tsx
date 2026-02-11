import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface HeaderProps {
    title?: string;
    showChat?: boolean;
    showSettings?: boolean;
    showBack?: boolean;
    onBackPress?: () => void;
    rightComponent?: React.ReactNode;
}

export default function Header({
    title = 'SmileFood',
    showChat = true,
    showSettings = true,
    showBack = false,
    onBackPress,
    rightComponent,
}: HeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            router.back();
        }
    };

    return (
        <View className="flex-row justify-between items-center px-5 py-4 bg-gray-50/0">
            <View className="flex-row items-center gap-2">
                {showBack && (
                    <TouchableOpacity onPress={handleBack} className="mr-1 p-1">
                        <Ionicons name="arrow-back" size={24} color="#1f2937" />
                    </TouchableOpacity>
                )}
                <Text className="text-2xl font-bold text-gray-800">{title}</Text>
            </View>

            <View className="flex-row items-center gap-3">
                {showChat && (
                    <TouchableOpacity
                        className="p-2 rounded-full bg-gray-50"
                        onPress={() => router.push('/chat-list')}
                    >
                        <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                )}
                {showSettings && (
                    <TouchableOpacity
                        className="p-2 rounded-full bg-gray-50"
                        onPress={() => router.push('/settings')}
                    >
                        <Ionicons name="settings-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                )}
                {rightComponent}
            </View>
        </View>
    );
}
