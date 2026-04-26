import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    ActivityIndicator, SafeAreaView, TextInput, Alert, RefreshControl
} from 'react-native';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function WalletScreen() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pointsToConvert, setPointsToConvert] = useState('');
    const router = useRouter();

    const API_URL = 'https://smartdine-backend-ao8c.onrender.com';
    const PHONE = '9999999999'; // Dummy phone for demo

    const fetchWallet = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/wallet/${PHONE}`);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchWallet();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchWallet();
    };

    const handleAddFunds = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await axios.post(`${API_URL}/api/wallet/add`, { phone: PHONE, amount: 500 });
            Alert.alert("Success", "₹500 added to your wallet! (Demo Mode)");
            fetchWallet();
        } catch (err) {
            Alert.alert("Error", "Failed to add funds.");
        }
    };

    const handleConvertPoints = async () => {
        const pts = parseInt(pointsToConvert);
        if (isNaN(pts) || pts < 10) {
            Alert.alert("Invalid Amount", "Minimum 10 points required for conversion.");
            return;
        }

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await axios.post(`${API_URL}/api/wallet/convert-points`, {
                phone: PHONE,
                pointsToConvert: pts
            });
            Alert.alert("Success", `Converted ${pts} points into Wallet balance!`);
            setPointsToConvert('');
            fetchWallet();
        } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || "Conversion failed.");
        }
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#6C5CE7" />
            <Text style={styles.loadingText}>Syncing Wallet...</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Digital Wallet</Text>
                </View>

                {/* Balance Card */}
                <BlurView intensity={80} tint="light" style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Current Balance</Text>
                    <Text style={styles.balanceValue}>₹{data.balance.toLocaleString()}</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddFunds}>
                        <Text style={styles.addBtnText}>+ Add ₹500</Text>
                    </TouchableOpacity>
                </BlurView>

                {/* Points Section */}
                <View style={styles.pointsSection}>
                    <View style={styles.pointsInfo}>
                        <Text style={styles.pointsTitle}>Loyalty Points</Text>
                        <Text style={styles.pointsValue}>{data.points} pts</Text>
                    </View>
                    <View style={styles.convertRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Points to convert"
                            keyboardType="numeric"
                            value={pointsToConvert}
                            onChangeText={setPointsToConvert}
                        />
                        <TouchableOpacity style={styles.convertBtn} onPress={handleConvertPoints}>
                            <Text style={styles.convertBtnText}>Convert</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.hint}>Rate: 10 Points = ₹1 spendable cash</Text>
                </View>

                {/* Transactions */}
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                {data.transactions.length === 0 ? (
                    <Text style={styles.empty}>No transactions yet.</Text>
                ) : (
                    data.transactions.map((tx: any, i: number) => (
                        <View key={i} style={styles.txRow}>
                            <View>
                                <Text style={styles.txReason}>{tx.reason || 'Order Payment'}</Text>
                                <Text style={styles.txDate}>{new Date(tx.timestamp).toLocaleDateString()}</Text>
                            </View>
                            <Text style={[styles.txAmount, tx.type === 'Credit' ? styles.credit : styles.debit]}>
                                {tx.type === 'Credit' ? '+' : '-'} ₹{tx.amount}
                            </Text>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scroll: { padding: 25 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#64748B' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, marginTop: 20 },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    backText: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
    title: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
    balanceCard: {
        padding: 30,
        borderRadius: 25,
        backgroundColor: 'rgba(108, 92, 231, 0.1)',
        overflow: 'hidden',
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(108, 92, 231, 0.2)'
    },
    balanceLabel: { fontSize: 14, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1 },
    balanceValue: { fontSize: 42, fontWeight: '900', color: '#6C5CE7', marginVertical: 10 },
    addBtn: { backgroundColor: '#6C5CE7', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
    addBtnText: { color: '#FFF', fontWeight: 'bold' },
    pointsSection: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    pointsInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    pointsTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    pointsValue: { fontSize: 16, fontWeight: '900', color: '#10B981' },
    convertRow: { flexDirection: 'row', gap: 10 },
    input: { flex: 1, backgroundColor: '#F1F5F9', padding: 12, borderRadius: 12, fontSize: 14 },
    convertBtn: { backgroundColor: '#10B981', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 12 },
    convertBtnText: { color: '#FFF', fontWeight: 'bold' },
    hint: { fontSize: 11, color: '#94A3B8', marginTop: 10, textAlign: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 15 },
    txRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    txReason: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
    txDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    txAmount: { fontSize: 16, fontWeight: '800' },
    credit: { color: '#10B981' },
    debit: { color: '#EF4444' },
    empty: { textAlign: 'center', color: '#94A3B8', marginTop: 20 }
});
