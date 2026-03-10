import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

interface ButtonProps {
    title: string;
    onPress: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
    textClassName?: string;
}

export default function Button({
    title,
    onPress,
    isLoading = false,
    disabled = false,
    className = "",
    textClassName = ""
}: ButtonProps) {
    return (
        <TouchableOpacity
            className={`py-3 px-4 rounded-xl items-center flex-row justify-center ${isLoading || disabled
                    ? "bg-[#cccccc]"
                    : "bg-[#007AFF] active:opacity-80 hover:opacity-80"
                } ${className}`}
            onPress={onPress}
            disabled={isLoading || disabled}
        >
            {isLoading ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text className={`text-white text-lg font-semibold ${textClassName}`}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}