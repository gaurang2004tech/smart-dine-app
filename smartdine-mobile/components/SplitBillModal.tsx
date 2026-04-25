import React, { useState, useEffect } from 'react';
import {
    Modal, View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Dimensions, Animated, FlatList
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://smartdine-backend-ao8c.onrender.com';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SplitBillModalProps {
    visible: boolean;
    onClose: () => void;
    tableNumber: string;
    orders: any[];
}

export default function SplitBillModal({ visible, onClose, tableNumber, orders }: SplitBillModalProps) {
    const [splitMode, setSplitMode] = useState<'even' | 'item'>('even');
    const [guestCount, setGuestCount] = useState(2);
    const [selectedItems, setSelectedItems] = useState<string[]>([]); // Array of unique item IDs (orderId-index)
    const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
    const router = useRouter();

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 50,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    // Flatten all items from all orders for the table
    const allItems = orders.flatMap(order =>
        order.items.map((item: any, index: number) => ({
            ...item,
            uniqueId: `${order._id}-${index}`,
            orderId: order._id
        }))
    );

    const tableTotal = allItems.reduce((sum, item) => sum + (item.menuItem?.price || 0), 0);

    const toggleItemSelection = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const calculateMyShare = () => {
        if (splitMode === 'even') {
            return (tableTotal / guestCount).toFixed(2);
        } else {
            return allItems
                .filter(item => selectedItems.includes(item.uniqueId))
                .reduce((sum, item) => sum + (item.menuItem?.price || 0), 0)
                .toFixed(2);
        }
    };

    const handlePayShare = async () => {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // 🆕 Actually call the payment API for the table!
            await axios.patch(`${API_URL}/api/orders/table/${tableNumber}/pay`);

            // 🆕 Clear local tracking state so the banner disappears
            await AsyncStorage.removeItem('activeOrderId');

            alert(`Payment Success! Your table's bill has been settled.`);
            onClose();

            // Redirect to splash screen
            router.dismissAll();
            router.push('/');
        } catch (error) {
            console.error(error);
            alert("Payment synchronization failed. Please try again.");
        }
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            {/* Backdrop */}
            <View style={StyleSheet.absoluteFillObject}>
                <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark">
                    <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
                </BlurView>
            </View>

            <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                <BlurView intensity={95} style={StyleSheet.absoluteFill} tint="light" />

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.handle} />
                    <Text style={styles.title}>Split Table Bill 💸</Text>
                    <Text style={styles.subtitle}>Table: {tableNumber} | Total: ₹{tableTotal}</Text>
                </View>

                {/* Mode Selector */}
                <View style={styles.modeContainer}>
                    <TouchableOpacity
                        style={[styles.modeButton, splitMode === 'even' && styles.modeButtonActive]}
                        onPress={() => { setSplitMode('even'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    >
                        <Text style={[styles.modeText, splitMode === 'even' && styles.modeTextActive]}>Split Evenly</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeButton, splitMode === 'item' && styles.modeButtonActive]}
                        onPress={() => { setSplitMode('item'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    >
                        <Text style={[styles.modeText, splitMode === 'item' && styles.modeTextActive]}>By My Items</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    {splitMode === 'even' ? (
                        <View style={styles.evenSplitCard}>
                            <Text style={styles.label}>Number of Guests</Text>
                            <View style={styles.guestControls}>
                                <TouchableOpacity
                                    style={styles.circleButton}
                                    onPress={() => guestCount > 1 && setGuestCount(guestCount - 1)}
                                >
                                    <Text style={styles.buttonText}>−</Text>
                                </TouchableOpacity>
                                <Text style={styles.guestValue}>{guestCount}</Text>
                                <TouchableOpacity
                                    style={styles.circleButton}
                                    onPress={() => setGuestCount(guestCount + 1)}
                                >
                                    <Text style={styles.buttonText}>+</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.infoText}>₹{tableTotal} divided by {guestCount} guests</Text>
                        </View>
                    ) : (
                        <View>
                            <Text style={styles.label}>Select items you consumed:</Text>
                            {allItems.map((item) => (
                                <TouchableOpacity
                                    key={item.uniqueId}
                                    style={[styles.itemCard, selectedItems.includes(item.uniqueId) && styles.itemCardActive]}
                                    onPress={() => toggleItemSelection(item.uniqueId)}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.itemName}>{item.menuItem?.name}</Text>
                                        <Text style={styles.itemPrice}>₹{item.menuItem?.price}</Text>
                                    </View>
                                    <View style={[styles.checkbox, selectedItems.includes(item.uniqueId) && styles.checkboxActive]}>
                                        {selectedItems.includes(item.uniqueId) && <Text style={{ color: '#FFF', fontSize: 10 }}>✓</Text>}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <View>
                        <Text style={styles.footerLabel}>YOUR SHARE</Text>
                        <Text style={styles.footerValue}>₹{calculateMyShare()}</Text>
                    </View>
                    <TouchableOpacity style={styles.payButton} onPress={handlePayShare}>
                        <Text style={styles.payButtonText}>Pay Share ➔</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: SCREEN_HEIGHT * 0.75,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    header: {
        paddingHorizontal: 25,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1A202C',
    },
    subtitle: {
        fontSize: 14,
        color: '#718096',
        marginTop: 4,
        fontWeight: '600',
    },
    modeContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginHorizontal: 25,
        borderRadius: 12,
        padding: 4,
        marginBottom: 25,
    },
    modeButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    modeButtonActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    modeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#718096',
    },
    modeTextActive: {
        color: '#1A202C',
    },
    content: {
        flex: 1,
        paddingHorizontal: 25,
    },
    label: {
        fontSize: 16,
        fontWeight: '800',
        color: '#4A5568',
        marginBottom: 15,
    },
    evenSplitCard: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    guestControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 30,
        marginVertical: 15,
    },
    circleButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#1A202C',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    guestValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1A202C',
    },
    infoText: {
        fontSize: 14,
        color: '#A0AEC0',
        fontWeight: '600',
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.4)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    itemCardActive: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderColor: '#1A202C',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
    },
    itemPrice: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '700',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#CBD5E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: '#48BB78',
        borderColor: '#48BB78',
    },
    footer: {
        padding: 25,
        paddingBottom: 40,
        backgroundColor: 'rgba(255,255,255,0.8)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    footerLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#A0AEC0',
        letterSpacing: 1,
    },
    footerValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1A202C',
    },
    payButton: {
        backgroundColor: '#1A202C',
        paddingVertical: 16,
        paddingHorizontal: 25,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    payButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
});
