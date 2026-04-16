import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { io } from 'socket.io-client';

export default function TrackingScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);

  // ⚠️ Ensure this matches your backend IP!
  const API_URL = 'http://192.168.1.4:3000';

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders/${orderId}`);
      setOrder(res.data);
    } catch (error) {
      console.error("Failed to fetch order details", error);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Listen for live status updates from the kitchen!
    const socket = io(API_URL);
    socket.on('orderUpdated', () => {
      fetchOrder(); 
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  const handlePayment = async () => {
    try {
      // Hit the public payment door we created earlier
      await axios.patch(`${API_URL}/api/orders/${orderId}/pay`);
      alert("Payment Successful! 💳 Thank you for dining with SmartDine.");
      router.push('/'); // Teleport back to the menu
    } catch (error) {
      console.error(error);
      alert("Payment failed. Please try again.");
    }
  };

  if (!order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  // 1. Check if the food is served
  const isServed = order.status && order.status.toLowerCase() === 'served';

  // 2. Calculate the exact bill total dynamically
  const billTotal = order.items.reduce((sum: number, item: any) => {
    if (item.menuItem && item.menuItem.price) {
      return sum + (item.menuItem.price * item.quantity);
    }
    return sum;
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Order #{order.tableNumber}</Text>

      {!isServed ? (
        /* --- STATUS SCREEN (Before food arrives) --- */
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>CURRENT STATUS</Text>
          <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
          <Text style={styles.subtitle}>The kitchen is currently preparing your delicious meal.</Text>
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
          </View>

          <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
            <Text style={styles.payButtonText}>Pay ₹{billTotal} Now</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginVertical: 20 },
  
  statusContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  statusLabel: { fontSize: 14, color: '#666', fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  statusText: { fontSize: 40, fontWeight: '900', color: '#E65100', marginBottom: 15 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', paddingHorizontal: 40 },

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
  payButtonText: { color: '#FFF', fontSize: 18, fontWeight: '800' }
});