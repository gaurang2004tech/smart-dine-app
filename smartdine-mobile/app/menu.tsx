import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';

export default function MenuScreen() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');

  const router = useRouter();

  // ⚠️ Ensure this matches your backend IP exactly!
  const API_URL = 'http://192.168.1.4:3000';

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/menu`);
        setMenuItems(res.data);
      } catch (error) {
        console.error("Failed to fetch menu", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // --- FILTER LOGIC ---
  const categories = ['All', ...new Set(menuItems.map(item => item.category).filter(Boolean))];
  const displayedItems = activeCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  // --- CART LOGIC ---
  const addToCart = (item: any) => {
    setCart([...cart, item]);
  };

  const removeFromCart = (itemToRemove: any) => {
    const index = cart.findIndex((cartItem) => cartItem._id === itemToRemove._id);
    if (index !== -1) {
      const updatedCart = [...cart];
      updatedCart.splice(index, 1);
      setCart(updatedCart);
    }
  };

  const getItemCount = (itemId: string) => {
    return cart.filter((cartItem) => cartItem._id === itemId).length;
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    
    try {
      const orderItems = cart.map(item => ({
        menuItem: item._id,
        quantity: 1 // Note: The backend will compress identical items, but sending as 1s works for our array
      }));

      const res = await axios.post(`${API_URL}/api/orders`, {
        tableNumber: 'Table-1', 
        items: orderItems
      });

      setCart([]);
      router.push({ pathname: '/tracking', params: { orderId: res.data._id } });
      
    } catch (error) {
      console.error(error);
      alert("Failed to place order.");
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
      <Text style={styles.headerTitle}>Our Menu</Text>

      {/* FILTER BAR */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {categories.map((category, index) => (
            <TouchableOpacity 
              key={index}
              style={[
                styles.filterPill, 
                activeCategory === category && styles.filterPillActive 
              ]}
              onPress={() => setActiveCategory(category)}
            >
              <Text style={[
                styles.filterText,
                activeCategory === category && styles.filterTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* MENU ITEMS */}
      <ScrollView contentContainerStyle={styles.menuList}>
        {displayedItems.map((item: any) => (
          <View key={item._id} style={styles.menuCard}>
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price}</Text>
            </View>
            
            {item.inStock ? (
              getItemCount(item._id) > 0 ? (
                /* SMART COUNTER UI */
                <View style={styles.quantityControl}>
                  <TouchableOpacity style={styles.qtyButton} onPress={() => removeFromCart(item)}>
                    <Text style={styles.qtyText}>-</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.qtyCount}>{getItemCount(item._id)}</Text>
                  
                  <TouchableOpacity style={styles.qtyButton} onPress={() => addToCart(item)}>
                    <Text style={styles.qtyText}>+</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* NORMAL ADD BUTTON */
                <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item)}>
                  <Text style={styles.addButtonText}>ADD</Text>
                </TouchableOpacity>
              )
            ) : (
              <Text style={styles.outOfStock}>Out of Stock</Text>
            )}

          </View>
        ))}
      </ScrollView>

      {/* FLOATING CART BAR */}
      {cart.length > 0 && (
        <View style={styles.bottomCartBar}>
          <View>
            <Text style={styles.cartItemCount}>{cart.length} ITEM(S) IN CART</Text>
            <Text style={styles.cartTotal}>
              Total: ₹{cart.reduce((sum, item) => sum + (item.price || 0), 0)}
            </Text>
          </View>
          <TouchableOpacity style={styles.placeOrderButton} onPress={placeOrder}>
            <Text style={styles.placeOrderText}>Checkout ➔</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#1A1A1A', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  
  filterContainer: { paddingBottom: 15 },
  filterScroll: { paddingHorizontal: 20, gap: 10 },
  filterPill: { paddingVertical: 8, paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  filterPillActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  filterText: { fontSize: 15, fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#FFF' },

  menuList: { paddingHorizontal: 20, paddingBottom: 120 }, 
  menuCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  itemName: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 5 },
  itemPrice: { fontSize: 16, fontWeight: '600', color: '#2E7D32' },
  
  addButton: { backgroundColor: '#1A1A1A', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  addButtonText: { color: '#FFF', fontWeight: '700' },
  outOfStock: { color: '#E65100', fontWeight: '700', paddingRight: 10 },

  // Smart Counter Styles
  quantityControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#1A1A1A', borderRadius: 8, overflow: 'hidden' },
  qtyButton: { paddingVertical: 6, paddingHorizontal: 15, backgroundColor: '#f0f0f0' },
  qtyText: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  qtyCount: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', minWidth: 25, textAlign: 'center' },

  bottomCartBar: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#1A1A1A', padding: 20, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 999, zIndex: 999 },
  cartItemCount: { color: '#A0AEC0', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  cartTotal: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  placeOrderButton: { backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  placeOrderText: { color: '#1A1A1A', fontSize: 16, fontWeight: '800' }
});