import { forwardRef } from 'react';
import {
    TextInput as RNTextInput,
    TextInputProps as RNTextInputProps,
    Text,
    View,
} from 'react-native';

interface LabeledTextInputProps extends RNTextInputProps {
    /** 입력 필드 위에 표시될 라벨 텍스트 */
    label: string;
    /** 외부 컨테이너(View)에 추가할 className */
    containerClassName?: string;
    /** TextInput에 추가할 className */
    inputClassName?: string;
}

const LabeledTextInput = forwardRef<RNTextInput, LabeledTextInputProps>(
    (
        {
            label,
            containerClassName = '',
            inputClassName = '',
            placeholderTextColor = '#999',
            ...textInputProps
        },
        ref
    ) => {
        return (
            <View className={`mb-5 ${containerClassName}`}>
                <Text className='text-base font-semibold text-[#333] mb-2'>{label}</Text>
                <RNTextInput
                    ref={ref}
                    className={`border border-[#ddd] rounded-xl px-4 py-3 text-base leading-5 text-black bg-[#f9f9f9] ${inputClassName}`}
                    placeholderTextColor={placeholderTextColor}
                    {...textInputProps}
                />
            </View>
        );
    }
);

LabeledTextInput.displayName = 'LabeledTextInput';

export default LabeledTextInput;
