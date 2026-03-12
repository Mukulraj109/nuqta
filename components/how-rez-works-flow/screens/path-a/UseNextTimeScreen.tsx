import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FlowScreenLayout from '../../shared/FlowScreenLayout';
import ActionBtn from '../../shared/ActionBtn';
import { NavigationAction, BackAction } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { useRegion } from '@/contexts/RegionContext';
import { BRAND } from '@/constants/brand';

interface Props {
    onNavigate: NavigationAction;
    onBack: BackAction;
}

const UseNextTimeScreen: React.FC<Props> = ({ onNavigate, onBack }) => {
    const { getCurrencySymbol } = useRegion();
    const currencySymbol = getCurrencySymbol();
    return (
        <FlowScreenLayout
            title="Use rewards next time"
            subtitle={`The more you use ${BRAND.APP_NAME}, the more you save.`}
            onBack={onBack}
            footer={<ActionBtn title="Continue Shopping" onPress={() => onNavigate('FINAL')} />}
        >
            <View style={styles.billCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Next Bill Example</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Bill Amount</Text>
                    <Text style={styles.value}>{currencySymbol}500</Text>
                </View>

                <View style={[styles.row, styles.discountRow]}>
                    <View style={styles.discountLabel}>
                        <Ionicons name="checkmark-circle" size={16} color="#1a3a52" />
                        <Text style={styles.discountText}>{`Use 100 ${BRAND.COIN_NAME}`}</Text>
                    </View>
                    <Text style={styles.discountValue}>- {currencySymbol}100</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <Text style={styles.totalLabel}>You Pay</Text>
                    <Text style={styles.totalValue}>{currencySymbol}400</Text>
                </View>
            </View>
        </FlowScreenLayout>
    );
};

const styles = StyleSheet.create({
    billCard: {
        marginTop: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
    },
    cardHeader: {
        marginBottom: 20,
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        color: '#374151',
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    discountRow: {
        backgroundColor: '#faf1e0',
        padding: 12,
        borderRadius: 12,
        marginHorizontal: -12,
    },
    discountLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    discountText: {
        fontSize: 15,
        color: '#1a3a52',
        fontWeight: '500',
    },
    discountValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a3a52',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    totalValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
    },
});

export default UseNextTimeScreen;
