import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

interface SettingItem {
    label: string;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
}

interface SettingSectionProps {
    title: string;
    items: SettingItem[];
}

export default function SettingSection({ title, items }: SettingSectionProps) {
    return (
        <View className="mx-5 mb-6">
        {/* 타이틀이 있을 때만 렌더링 */}
        {title && (
            <Text className="px-4 py-2 mb-1 text-sm text-gray-500 font-medium ml-1">
                {title}
            </Text>
        )}
        
        <View>
            {items.map((item, index) => {
                const isFirst = index === 0;
                const isLast = index === items.length - 1;
                const isOnly = isFirst && isLast; // 요소가 하나뿐인 경우

                const radiusStyle = isOnly 
                    ? "rounded-2xl" 
                    : isFirst 
                        ? "rounded-t-2xl" 
                        : isLast 
                            ? "rounded-b-2xl" 
                            : "";

                // 마지막 아이템은 밑줄 제거
                const borderStyle = isLast ? "border-b-0" : "border-b border-gray-100";

                return (
                    <TouchableOpacity
                        key={index}
                        activeOpacity={0.7} // 터치 시 반짝임 효과 자연스럽게
                        onPress={item.onPress}
                        className={`flex-row justify-between items-center px-5 py-4 bg-white ${radiusStyle} ${borderStyle}`}
                    >
                        <Text className="text-base text-gray-800 font-medium">
                            {item.label}
                        </Text>
                        <Ionicons
                            name={item.icon || "chevron-forward"} // iOS 스타일 화살표
                            size={20}
                            color="#C7C7CC" // iOS 기본 화살표 색상
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    </View>
    );
}