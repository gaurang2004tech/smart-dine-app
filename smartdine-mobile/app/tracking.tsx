import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, ScrollView, Modal, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { io } from 'socket.io-client';
import * as Haptics from 'expo-haptics';
import OrderStatusTimeline from '../components/OrderStatusTimeline';
import SplitBillModal from '../components/SplitBillModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TrackingScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // Rating modal state
  const [showRating, setShowRating] = useState(false);
  const [selectedStars, setSelectedStars] = useState<Record<string, number>>({});
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Bill splitting state
  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [tableOrders, setTableOrders] = useState<any[]>([]);
  const [fetchingTable, setFetchingTable] = useState(false);

  const API_URL = 'https://smartdine-backend-ao8c.onrender.com';

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders/${orderId}`);
      setOrder(res.data);
    } catch (error) {
      console.error('Failed to fetch order details', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/users/9999999999`);
      setUser(res.data);
    } catch (err) {
      console.error('Profile fetch failed', err);
    }
  };

  const fetchTableOrders = async () => {
    if (!order?.tableNumber) return;

    setFetchingTable(true);
    try {
      const res = await axios.get(`${API_URL}/api/orders/table/${order.tableNumber}`);
      setTableOrders(res.data);
      setSplitModalVisible(true);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Failed to fetch table orders.';
      const stack = error.response?.data?.location || '';
      alert(`${msg} ${stack}`);
    } finally {
      setFetchingTable(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    fetchProfile();
    const socket = io(API_URL);
    socket.on('orderUpdated', () => fetchOrder());
    return () => { socket.disconnect(); };
  }, [orderId]);

  const handlePayment = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await axios.patch(`${API_URL}/api/orders/${orderId}/pay`, {});
      // Clear saved orderId — order is done, banner disappears from menu
      await AsyncStorage.removeItem('activeOrderId');
      setShowRating(true);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Payment failed.';
      const loc = error.response?.data?.location || '';
      alert(`${msg} ${loc}. Please try again.`);
    }
  };

  const handleWalletPayment = async () => {
    const total = billTotal;
    if ((user?.walletBalance || 0) < total) {
      Alert.alert("Insufficient Balance", "Please add funds to your wallet to continue.");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      // 💳 Pay via Wallet (Backend handles debit + order update)
      await axios.patch(`${API_URL}/api/orders/${orderId}/pay`, { paymentMethod: 'Wallet' });

      // Clear active order
      await AsyncStorage.removeItem('activeOrderId');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowRating(true);
      fetchProfile(); // Update balance
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Wallet payment failed.';
      const loc = error.response?.data?.location || '';
      alert(`${msg} ${loc}`);
    }
  };

  const submitRatings = async () => {
    try {
      const ratings = Object.entries(selectedStars).map(([menuItemId, stars]) => ({
        menuItemId,
        stars,
      }));
      if (ratings.length > 0) {
        await axios.post(`${API_URL}/api/ratings`, { orderId, ratings });
      }
    } catch (error) {
      console.error('Rating submit failed:', error);
    } finally {
      setRatingSubmitted(true);
      setTimeout(() => {
        setShowRating(false);
        router.push('/');
      }, 1200);
    }
  };

  if (!order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 14,
          backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F5'
        }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#1A1A1A' }}>‹ Back</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1A1A1A" />
        </View>
      </SafeAreaView>
    );
  }

  const isServed = order.status && order.status.toLowerCase() === 'served';
  const billTotal = order.items.reduce((sum: number, item: any) => {
    if (item.menuItem && item.menuItem.price) {
      return sum + item.menuItem.price * item.quantity;
    }
    return sum;
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── iOS-STYLE HEADER WITH BACK BUTTON ── */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitleText} numberOfLines={1}>
          Order #{order.tableNumber}
        </Text>
        {/* invisible spacer to keep title centered */}
        <View style={styles.backBtnSpacer} />
      </View>

      {!isServed ? (
        /* --- STATUS SCREEN (Before food arrives) --- */
        <View style={styles.statusContainer}>
          <OrderStatusTimeline status={order.status} />
          <Text style={styles.subtitle}>We'll update you as your meal progresses! 🍽️</Text>
        </View>
      ) : (
        /* --- DIGITAL BILL SCREEN (After food is served) --- */
        <ScrollView contentContainerStyle={styles.billContainer}>
          <View style={styles.receiptCard}>
            <Text style={styles.receiptHeader}>Your Bill</Text>
            <View style={styles.divider} />

            {order.items.map((item: any, index: number) => (
              <View key={index} style={styles.receiptRow}>
                <Text style={styles.receiptItem}>
                  {item.quantity}x {item.menuItem ? item.menuItem.name : 'Unknown Item'}
                </Text>
                <Text style={styles.receiptPrice}>
                  ₹{item.menuItem ? item.menuItem.price * item.quantity : 0}
                </Text>
              </View>
            ))}

            <View style={styles.divider} />
            <View style={styles.receiptRow}>
              <Text style={styles.totalLabel}>Total to Pay</Text>
              <Text style={styles.totalAmount}>₹{billTotal}</Text>
            </View>

            {/* 🆕 Points Info */}
            <View style={styles.pointsEarnedContainer}>
              <Text style={styles.pointsEarnedText}>
                ✨ You will spend/earn <Text style={styles.pointsHighlight}>{Math.floor(billTotal)}</Text> Loyalty Points on this order
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
            <Text style={styles.payButtonText}>Pay ₹{billTotal} with Cash/Card 💵</Text>
          </TouchableOpacity>

          {/* 🆕 WALLET PAYMENT BUTTON */}
          <TouchableOpacity
            style={[styles.walletPayButton, (user?.walletBalance || 0) < billTotal && styles.walletDisabled]}
            onPress={handleWalletPayment}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.walletPayButtonText}>Pay with SmartDine Wallet 💳</Text>
            </View>
            <Text style={styles.walletBalanceSub}>Balance: ₹{user?.walletBalance || 0}</Text>
          </TouchableOpacity>

          {/* 🆕 SPLIT BILL ACTION */}
          <TouchableOpacity
            style={styles.splitButton}
            onPress={fetchTableOrders}
            disabled={fetchingTable}
          >
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.splitButtonText}>
              {fetchingTable ? 'Fetching Table Bill...' : '💳 Split & Pay Table Bill'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── SPLIT BILL MODAL ── */}
      <SplitBillModal
        visible={splitModalVisible}
        onClose={() => setSplitModalVisible(false)}
        tableNumber={order?.tableNumber || 'Table-?'}
        orders={tableOrders}
      />

      {/* ── RATING MODAL ─────────────────────────────────────────── */}
      <Modal visible={showRating} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            {ratingSubmitted ? (
              /* Thank you state */
              <View style={styles.thankyouContainer}>
                <Text style={styles.thankyouEmoji}>🎉</Text>
                <Text style={styles.thankyouTitle}>Thank you!</Text>
                <Text style={styles.thankyouSub}>Payment successful. Enjoy your meal!</Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalTitle}>Rate Your Meal</Text>
                <Text style={styles.modalSubtitle}>How was each dish? (Tap to rate)</Text>

                <ScrollView style={styles.ratingList} showsVerticalScrollIndicator={false}>
                  {order.items.map((item: any, idx: number) => {
                    if (!item.menuItem) return null;
                    const itemId = item.menuItem._id;
                    const currentStar = selectedStars[itemId] || 0;
                    return (
                      <View key={idx} style={styles.ratingRow}>
                        <Text style={styles.ratingItemName} numberOfLines={1}>
                          {item.menuItem.name}
                        </Text>
                        <View style={styles.starsRow}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <TouchableOpacity
                              key={star}
                              style={{ marginRight: 4 }}
                              onPress={() => setSelectedStars(prev => ({ ...prev, [itemId]: star }))}
                            >
                              <Text style={[
                                styles.starIcon,
                                star <= currentStar ? styles.starIconFilled : undefined,
                              ]}>
                                {star <= currentStar ? '★' : '☆'}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.skipBtn, { marginRight: 12 }]} onPress={() => {
                    setShowRating(false);
                    router.push('/');
                  }}>
                    <Text style={styles.skipBtnText}>Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitBtn} onPress={submitRatings}>
                    <Text style={styles.submitBtnText}>Submit ★</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  backBtn: {
    width: 70,
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  headerTitleText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  backBtnSpacer: { width: 70 },

  statusContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  subtitle: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 40, marginTop: 12 },

  billContainer: { padding: 20 },
  receiptCard: { backgroundColor: '#FFF', padding: 25, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 3, marginBottom: 30 },
  receiptHeader: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  receiptItem: { fontSize: 16, color: '#333', fontWeight: '500' },
  receiptPrice: { fontSize: 16, color: '#1A1A1A', fontWeight: '700' },
  totalLabel: { fontSize: 18, color: '#1A1A1A', fontWeight: '800' },
  totalAmount: { fontSize: 24, color: '#2E7D32', fontWeight: '900' },
  payButton: { backgroundColor: '#1A1A1A', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  payButtonText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  // ── Rating Modal ────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, maxHeight: 560 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 20 },

  ratingList: { maxHeight: 280 },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  ratingItemName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginRight: 10 },
  starsRow: { flexDirection: 'row' },
  starIcon: { fontSize: 28, color: '#D1D5DB' },
  starIconFilled: { color: '#F59E0B' },

  modalButtons: { flexDirection: 'row', marginTop: 20 },
  skipBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  skipBtnText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  submitBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: '#1A1A1A', alignItems: 'center' },
  submitBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },

  thankyouContainer: { alignItems: 'center', paddingVertical: 30 },
  thankyouEmoji: { fontSize: 56, marginBottom: 12 },
  thankyouTitle: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', marginBottom: 8 },
  thankyouSub: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },

  splitButton: {
    backgroundColor: '#1A202C',
    borderRadius: 18,
    height: 64,
    marginTop: 15,
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  splitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pointsEarnedContainer: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  pointsEarnedText: {
    fontSize: 13,
    color: '#0369A1',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  pointsHighlight: {
    fontWeight: '900',
    color: '#0284C7',
  },
  walletPayButton: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  walletDisabled: {
    backgroundColor: '#A0AEC0',
    shadowOpacity: 0,
    elevation: 0,
  },
  walletPayButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  walletBalanceSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});