import { foodAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Keyboard,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

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
            <View style={styles.modalShade}>
                <View style={styles.manualModalContent}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name='arrow-back' size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalTitleContainer}>
                        <Text style={styles.modalTitle}>식품 수동 등록</Text>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="식품 바코드 번호"
                        placeholderTextColor="#999"
                        value={manualBarcode}
                        onChangeText={setManualBarcode}
                        keyboardType="number-pad"
                        onSubmitEditing={() => Keyboard.dismiss()}
                        blurOnSubmit={true}
                        returnKeyType="done"
                    />

                    <View style={styles.quantityContainer}>
                        <Text style={styles.quantityLabel}>식품 수량</Text>
                        <View style={styles.quantityControls}>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => {
                                    const current = parseInt(manualCount, 10) || 1;
                                    if (current > 1) setManualCount(String(current - 1));
                                }}
                                disabled={manualAdding}
                            >
                                <Ionicons name="remove" size={20} color="#007aff" />
                            </TouchableOpacity>
                            <Text style={styles.quantityValue}>{manualCount}</Text>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => {
                                    const current = parseInt(manualCount, 10) || 1;
                                    if (current < 999) setManualCount(String(current + 1));
                                }}
                                disabled={manualAdding}
                            >
                                <Ionicons name="add" size={20} color="#007aff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.modalPrimaryButton, manualAdding && styles.modalPrimaryButtonDisabled]}
                        onPress={handleAddFood}
                        disabled={manualAdding}
                    >
                        <Text style={[styles.modalPrimaryButtonText, manualAdding && styles.modalPrimaryButtonTextDisabled]}>
                            {manualAdding ? '추가 중...' : '식품 추가'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalShade: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // 반투명 배경을 좀 더 진하게 조정
        paddingTop: 100,
        paddingBottom: 80,
        paddingLeft: 40,
        paddingRight: 40,
    },
    manualModalContent: {
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        backgroundColor: '#fff',
        width: '100%',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3.84,
        elevation: 5,
        // maxHeight 제거하고 flex를 사용하여 내용에 맞게 조정하도록 변경 가능하나, 
        // 키보드가 올라올 때를 대비해 원래 스타일 유지
        maxHeight: '80%',
    },
    modalHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        padding: 20,
        zIndex: 20,
        borderRadius: 16,
    },
    modalTitleContainer: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 30,
        paddingLeft: 20,
        paddingRight: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        width: '100%',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 20,
        color: '#333',
        minHeight: 50,
    },
    quantityContainer: {
        marginBottom: 20,
    },
    quantityLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    quantityButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#007aff',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        minWidth: 60,
        textAlign: 'center',
    },
    modalPrimaryButton: {
        backgroundColor: '#007aff',
        width: '100%',
        borderRadius: 12,
        paddingTop: 15,
        paddingBottom: 15,
        paddingLeft: 20,
        paddingRight: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        marginTop: 20,
    },
    modalPrimaryButtonDisabled: {
        backgroundColor: '#cccccc',
        shadowOpacity: 0.05,
        elevation: 2,
    },
    modalPrimaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalPrimaryButtonTextDisabled: {
        color: '#999999',
    },
});
