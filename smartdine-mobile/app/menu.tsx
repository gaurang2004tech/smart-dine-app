import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView, Image, TextInput, Alert
} from 'react-native';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import ItemDetailModal from '../components/ItemDetailModal';
import Confetti from '../components/Confetti';
import MembershipCard from '../components/MembershipCard';
import MenuImage from '../components/MenuImage';

export default function MenuScreen() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratings, setRatings] = useState<Record<string, { average: number; count: number }>>({});
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [tableNumber, setTableNumber] = useState<string>('Table-1');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [user, setUser] = useState<any>(null); // 🆕 Loyalty Profile

  const confettiRef = useRef<any>(null);
  const router = useRouter();

  // 🌟 Read the table number passed from the QR scanner (index.tsx)
  const { tableId } = useLocalSearchParams<{ tableId: string }>();
  const API_URL = 'http://192.168.1.4:3000';

  // Resolve table number: prefer fresh QR param, then AsyncStorage, then fallback to redirection
  useEffect(() => {
    const resolveTable = async () => {
      if (tableId) {
        // Fresh scan — save and use it
        setTableNumber(tableId);
        await AsyncStorage.setItem('currentTable', tableId);
      } else {
        // No param (e.g. navigated back without scanning) — check for saved value
        const saved = await AsyncStorage.getItem('currentTable');
        if (saved) {
          setTableNumber(saved);
        } else {
          // 🛡️ NO TABLE IDENTIFIED -> Redirect back to scanner!
          // This prevents landing on the menu accidentally.
          router.replace('/');
        }
      }
    };
    resolveTable();
  }, [tableId]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [menuRes, ratingsRes] = await Promise.all([
          axios.get(`${API_URL}/api/menu`),
          axios.get(`${API_URL}/api/ratings`),
        ]);
        setMenuItems(menuRes.data);
        setRatings(ratingsRes.data);
      } catch (error) {
        console.error('Failed to fetch menu/ratings', error);
      } finally {
        setLoading(false);
      }
    };
    // Check if there's a saved orderId AND it's still an active (unpaid) order
    const checkActiveOrder = async () => {
      const saved = await AsyncStorage.getItem('activeOrderId');
      if (!saved) return;
      try {
        const res = await axios.get(`${API_URL}/api/orders/${saved}`);
        const status = res.data?.status?.toLowerCase();
        // Only show banner if order is genuinely in-progress
        const isActive = ['pending', 'preparing', 'ready', 'served'].includes(status);
        if (isActive) {
          setActiveOrderId(saved);
        } else {
          // Order is paid or unknown — clear it so banner never shows again
          await AsyncStorage.removeItem('activeOrderId');
        }
      } catch {
        // Order not found on server — clear stale ID
        await AsyncStorage.removeItem('activeOrderId');
      }
    };
    fetchAll();
    checkActiveOrder();

    // 🆕 Fetch Loyalty Profile (Using dummy phone for demo)
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users/9999999999`);
        setUser(res.data);
      } catch (err) {
        console.error('Profile fetch failed', err);
      }
    };
    fetchProfile();
  }, []);

  // ── Filter logic ──────────────────────────────────────────────────────────
  const categories = ['All', ...new Set(menuItems.map(item => item.category).filter(Boolean))];

  const displayedItems = menuItems
    .filter(item => activeCategory === 'All' || item.category === activeCategory)
    .filter(item => !isVegOnly || item.dietaryType === 'Veg')
    .filter(item =>
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // ── Cart logic ────────────────────────────────────────────────────────────
  const addToCart = (item: any, instructions: string = '') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const cartEntry = { ...item, instructions };
    setCart([...cart, cartEntry]);
  };

  const removeFromCart = (itemToRemove: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const index = cart.findIndex(c => c._id === itemToRemove._id);
    if (index !== -1) {
      const updated = [...cart];
      updated.splice(index, 1);
      setCart(updated);
    }
  };

  const getItemCount = (itemId: string) => cart.filter(c => c._id === itemId).length;

  const placeOrder = async () => {
    if (cart.length === 0) return;
    try {
      const orderItems = cart.map(item => ({
        menuItem: item._id,
        quantity: 1,
        instructions: item.instructions || ''
      }));
      const res = await axios.post(`${API_URL}/api/orders`, {
        tableNumber, // 🌟 uses state resolved from QR param or AsyncStorage
        customerPhone: user?.phoneNumber || '9999999999',
        items: orderItems,
        totalAmount: cart.reduce((sum, item) => sum + (item.price || 0), 0)
      });
      await AsyncStorage.setItem('activeOrderId', res.data._id);
      setCart([]);
      // 🎊 Fire confetti before navigating!
      confettiRef.current?.fire();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        router.push({ pathname: '/tracking', params: { orderId: res.data._id } });
      }, 1000);
    } catch (error) {
      console.error(error);
      alert('Failed to place order.');
    }
  };

  // ── Star renderer ─────────────────────────────────────────────────────────
  const renderStars = (average: number, count: number) => {
    if (count === 0) return null;
    const full = Math.floor(average);
    const half = average - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    const stars = '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
    return (
      <View style={styles.starsRow}>
        <Text style={styles.starsFilled}>{stars}</Text>
        <Text style={styles.starsCount}> {average} ({count})</Text>
      </View>
    );
  };

  const handleClaimGift = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      confettiRef.current?.fire(); // 🎊 Celebratory reset!
      const res = await axios.post(`${API_URL}/api/users/9999999999/claim-gift`);
      setUser(res.data.customer);
      alert("Gift Claimed! 🎁 Our team is preparing your gourmet reward right now.");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to claim gift");
    }
  };

  // 🆕 Helper to boost profile for testing purposes
  const boostProfile = async () => {
    try {
      await axios.post(`${API_URL}/api/users/9999999999/reward`, { pointsToAdd: 2100 });
      const res = await axios.get(`${API_URL}/api/users/9999999999`);
      setUser(res.data);
      alert("🚀 Profile Boosted! You are now a Black Card Member with 1 Gift.");
    } catch (err) {
      console.error(err);
    }
  };

  const callWaiter = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await axios.post(`${API_URL}/api/notifications/call-waiter`, { tableNumber });
      alert("Ding Dong! 🛎️ Waiter has been notified.");
    } catch (error) {
      console.error(error);
      alert("Failed to call waiter.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* ── HEADER ── */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 }}>
        <Text style={styles.headerTitle}>Our Menu</Text>
        <TouchableOpacity onPress={boostProfile}>
          <Text style={{ fontSize: 10, color: '#CBD5E0', fontWeight: '800' }}>[ TEST ELITE ]</Text>
        </TouchableOpacity>
      </View>

      {/* ── SEARCH BAR ── */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search dishes..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── CATEGORY FILTER BAR ── */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {/* Veg Only Toggle */}
          <TouchableOpacity
            style={[styles.filterPill, isVegOnly && { backgroundColor: '#2E7D32', borderColor: '#2E7D32' }]}
            onPress={() => setIsVegOnly(!isVegOnly)}
          >
            <Text style={[styles.filterText, isVegOnly && { color: '#FFF' }]}>
              {isVegOnly ? '🟢 Veg Only' : '🍀 Veg Only?'}
            </Text>
          </TouchableOpacity>

          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.filterPill, activeCategory === category && styles.filterPillActive]}
              onPress={() => setActiveCategory(category)}
            >
              <Text style={[styles.filterText, activeCategory === category && styles.filterTextActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── MENU ITEMS ── */}
      <ScrollView contentContainerStyle={styles.menuList}>

        {/* 🆕 ELITE LOYALTY CARD */}
        {user && <MembershipCard user={user} onClaim={handleClaimGift} />}

        {displayedItems.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>No dishes found for "{searchQuery}"</Text>
          </View>
        )}

        {displayedItems.map((item: any) => {
          const itemRating = ratings[item._id];
          const count = getItemCount(item._id);
          const hasImage = item.image && item.image.startsWith('http');
          const isCellar = item.isCellar === true;

          return (
            <TouchableOpacity
              key={item._id}
              style={[styles.menuCard, isCellar && styles.cellarCard]}
              activeOpacity={0.92}
              onPress={() => setSelectedItem(item)}
            >
              {/* Food image */}
              {hasImage && (
                <View>
                  <MenuImage
                    uri={item.image}
                    style={[styles.foodImage, isCellar && styles.cellarImage]}
                    resizeMode="cover"
                  />
                  {isCellar && (
                    <View style={styles.cellarBadge}>
                      <Text style={styles.cellarBadgeText}>EXCLUSIVE</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Info + actions row */}
              <View style={styles.cardBody}>
                <View style={styles.cardInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Text style={[styles.itemName, isCellar && styles.cellarItemName]}>
                      {item.isSpicy && <Text style={{ color: '#FF0000' }}>🌶️ </Text>}
                      {item.name}
                    </Text>
                    {!isCellar && (
                      <>
                        {item.dietaryType === 'Veg' && <Text style={{ marginLeft: 6, fontSize: 10 }}>🟢</Text>}
                        {item.dietaryType === 'Non-Veg' && <Text style={{ marginLeft: 6, fontSize: 10 }}>🔴</Text>}
                      </>
                    )}
                  </View>

                  {isCellar && (
                    <Text style={styles.cellarOrigin}>{item.vintage} • {item.origin}</Text>
                  )}

                  {/* Star rating */}
                  {!isCellar && itemRating && renderStars(itemRating.average, itemRating.count)}

                  <Text style={[styles.itemPrice, isCellar && styles.cellarPrice]}>₹{item.price}</Text>
                </View>

                {/* Add / Count controls — stopPropagation prevents modal opening */}
                {item.inStock ? (
                  count > 0 ? (
                    <View style={styles.quantityControl}>
                      <TouchableOpacity style={styles.qtyButton} onPress={(e) => { e.stopPropagation?.(); removeFromCart(item); }}>
                        <Text style={styles.qtyText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyCount}>{count}</Text>
                      <TouchableOpacity style={styles.qtyButton} onPress={(e) => { e.stopPropagation?.(); addToCart(item); }}>
                        <Text style={styles.qtyText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={[styles.addButton, isCellar && styles.cellarAddButton]} onPress={(e) => { e.stopPropagation?.(); addToCart(item); }}>
                      <Text style={[styles.addButtonText, isCellar && styles.cellarAddText]}>ADD</Text>
                    </TouchableOpacity>
                  )
                ) : (
                  <Text style={styles.outOfStock}>Out of Stock</Text>
                )}
              </View>

            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── FLOATING CART BAR ── */}
      {cart.length > 0 && (
        <TouchableOpacity style={styles.bottomCartBar} activeOpacity={0.94} onPress={placeOrder}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cartItemCount}>{cart.length} ITEM(S) IN CART</Text>
            <Text style={styles.cartTotal}>
              Total: ₹{cart.reduce((sum, item) => sum + (item.price || 0), 0)}
            </Text>
          </View>
          <View style={styles.placeOrderButton}>
            <Text style={styles.placeOrderText}>Checkout ➔</Text>
          </View>
        </TouchableOpacity>
      )}
      {/* ── TRACK MY ORDER BANNER ── */}
      {activeOrderId && cart.length === 0 && (
        <TouchableOpacity
          style={styles.trackOrderBar}
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: '/tracking', params: { orderId: activeOrderId } })}
        >
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <Text style={styles.trackOrderEmoji}>🛵</Text>
          <View>
            <Text style={styles.trackOrderTitle}>Your order is being prepared!</Text>
            <Text style={styles.trackOrderSub}>Tap to track your order live</Text>
          </View>
          <Text style={styles.trackOrderArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* ── ITEM DETAIL MODAL ── */}
      <ItemDetailModal
        item={selectedItem}
        rating={selectedItem ? ratings[selectedItem._id] : undefined}
        visible={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onAdd={addToCart}
        onRemove={removeFromCart}
        count={getItemCount}
      />

      {/* ── CALL WAITER FAB ── */}
      <TouchableOpacity style={styles.callWaiterFab} onPress={callWaiter}>
        <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
        <Text style={{ fontSize: 24 }}>🛎️</Text>
      </TouchableOpacity>

      {/* ── CONFETTI (absolute overlay, fires on order placed) ── */}
      <Confetti ref={confettiRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#1A1A1A', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F5',
  },
  searchIcon: { fontSize: 16, marginRight: 8, opacity: 0.5 },
  searchInput: { flex: 1, fontSize: 16, color: '#1A1A1A', fontWeight: '500' },

  // Category filters
  filterContainer: { paddingBottom: 12 },
  filterScroll: { paddingHorizontal: 20, gap: 10 },
  filterPill: { paddingVertical: 8, paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  filterPillActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  filterText: { fontSize: 15, fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#FFF' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },

  // Menu card
  menuList: { paddingHorizontal: 20, paddingBottom: 120 },
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  foodImage: { width: '100%', height: 160 },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  cardInfo: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  itemPrice: { fontSize: 16, fontWeight: '700', color: '#2E7D32', marginTop: 4 },

  // Stars
  starsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  starsFilled: { fontSize: 13, color: '#F59E0B', letterSpacing: 1 },
  starsCount: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },

  // Add button & counter
  addButton: { backgroundColor: '#1A1A1A', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 10 },
  addButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  outOfStock: { color: '#E65100', fontWeight: '700' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#1A1A1A', borderRadius: 10, overflow: 'hidden' },
  qtyButton: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: '#F5F5F5' },
  qtyText: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  qtyCount: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', minWidth: 26, textAlign: 'center' },

  // Cart bar
  bottomCartBar: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 999,
    zIndex: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cartItemCount: { color: '#A0AEC0', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  cartTotal: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  placeOrderButton: { backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  placeOrderText: { color: '#1A1A1A', fontSize: 16, fontWeight: '800' },

  // Track My Order banner
  trackOrderBar: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(108,92,231,0.6)', // Semi-transparent Purple
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 999,
    zIndex: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  trackOrderEmoji: { fontSize: 26, marginRight: 12 },
  trackOrderTitle: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  trackOrderSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  trackOrderArrow: { fontSize: 20, color: '#FFF', marginLeft: 'auto', fontWeight: '800' },

  // Call Waiter FAB
  callWaiterFab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 998,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
  },
  // --- Luxe Cellar Styles ---
  cellarCard: {
    backgroundColor: '#0F172A', // Deep navy
    borderColor: 'rgba(212, 175, 55, 0.3)', // Soft Gold
    borderWidth: 1,
  },
  cellarImage: {
    opacity: 0.9,
  },
  cellarBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#D4AF37', // Gold
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cellarBadgeText: {
    color: '#1A1A1A',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cellarItemName: {
    color: '#F1F5F9', // Crisp white
    fontFamily: 'serif',
    fontSize: 18,
  },
  cellarOrigin: {
    color: '#94A3B8',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  cellarPrice: {
    color: '#D4AF37', // Gold price
    fontWeight: '700',
  },
  cellarAddButton: {
    backgroundColor: 'transparent',
    borderColor: '#D4AF37',
    borderWidth: 1.5,
  },
  cellarAddText: {
    color: '#D4AF37',
  }
});