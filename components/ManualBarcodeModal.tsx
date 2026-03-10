import { foodAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from './Button';
import LabeledTextInput from './LabeledTextInput';

interface ManualBarcodeModalProps {
    visible: boolean;
    onClose: () => void;
    sessionId: string | null;
    onSuccess?: () => void;
}

export const ManualBarcodeModal: React.FC<ManualBarcodeModalProps> = ({
    visible,
    onClose,
    sessionId,
    onSuccess
}) => {
    const [manualBarcode, setManualBarcode] = useState('');
    const [manualCount, setManualCount] = useState('1');
    const [manualAdding, setManualAdding] = useState(false);

    // 모달이 닫힐 때 상태 초기화를 위해 커스텀 닫기 함수 사용
    const handleClose = () => {
        setManualBarcode('');
        setManualCount('1');
        onClose();
    };

    const handleAddFood = async () => {
        if (!sessionId || manualBarcode.trim() === '') {
            Alert.alert('알림', '바코드를 입력해주세요.');
            return;
        }
        const count = parseInt(manualCount, 10);
        if (!count || count < 1 || count > 999) {
            Alert.alert('알림', '식품 수량을 1~999 사이로 입력해주세요.');
            return;
        }

        try {
            setManualAdding(true);
            const response = await foodAPI.regiFood(sessionId, manualBarcode.trim(), count.toString());
            if (response.code === 200) {
                Alert.alert('식품 추가 완료', response.message, [{ text: '확인' }]);
                setManualBarcode('');
                setManualCount('1');
                onClose(); // 성공 시 모달 닫기
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                Alert.alert('오류', response.message || '식품 추가에 실패했습니다.');
            }
        } catch (error: any) {
            Alert.alert('오류', error?.response?.data?.message || '식품 추가에 실패했습니다.');
        } finally {
            setManualAdding(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View className="flex-1 items-center justify-center bg-black/50 px-10 py-20">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    className="w-full"
                >
                    <View className="w-full bg-white rounded-2xl p-5 shadow-lg shadow-black/20 max-h-[100%] items-stretch justify-start" style={{ elevation: 5 }}>
                        <View className="absolute top-0 left-0 w-full p-5 z-20 rounded-2xl">
                            <TouchableOpacity onPress={handleClose} accessibilityLabel="뒤로 가기">
                                <Ionicons name='arrow-back' size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        <View className="items-center mt-12 mb-7 px-5">
                            <Text className="text-2xl font-bold text-gray-800 text-center w-full">식품 수동 등록</Text>
                        </View>

                        <LabeledTextInput
                            label="식품 바코드 번호"
                            placeholder="바코드 번호를 입력하세요"
                            value={manualBarcode}
                            onChangeText={setManualBarcode}
                            keyboardType="number-pad"
                            onSubmitEditing={() => Keyboard.dismiss()}
                            blurOnSubmit={true}
                            returnKeyType="done"
                            accessibilityLabel="식품 바코드 번호 입력"
                        />

                        <View className="mb-5">
                            <Text className="text-base font-semibold text-gray-800 mb-2.5">식품 수량</Text>
                            <View className="flex-row items-center justify-center gap-5">
                                <TouchableOpacity
                                    className="w-10 h-10 rounded-full border-2 border-blue-500 bg-white items-center justify-center active:opacity-70"
                                    onPress={() => {
                                        const current = parseInt(manualCount, 10) || 1;
                                        if (current > 1) setManualCount(String(current - 1));
                                    }}
                                    disabled={manualAdding}
                                    accessibilityLabel="수량 감소"
                                >
                                    <Ionicons name="remove" size={20} color="#007aff" />
                                </TouchableOpacity>
                                <Text className="text-2xl font-bold text-gray-800 min-w-[60] text-center">{manualCount}</Text>
                                <TouchableOpacity
                                    className="w-10 h-10 rounded-full border-2 border-blue-500 bg-white items-center justify-center active:opacity-70"
                                    onPress={() => {
                                        const current = parseInt(manualCount, 10) || 1;
                                        if (current < 999) setManualCount(String(current + 1));
                                    }}
                                    disabled={manualAdding}
                                    accessibilityLabel="수량 증가"
                                >
                                    <Ionicons name="add" size={20} color="#007aff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <Button title="식품 추가" onPress={handleAddFood} isLoading={manualAdding} disabled={manualAdding} />
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};
