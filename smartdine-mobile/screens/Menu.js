import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import axios from 'axios';

const API_URL = "http://192.168.1.4:3000/api/menu"; // Use your actual IP, not localhost

export default function Menu({ route }) {
  const { tableId } = route.params;
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    axios.get(API_URL).then(res => setItems(res.data));
  }, []);

  const addToCart = (item) => {
    setCart([...cart, { ...item, quantity: 1 }]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Table {tableId} Menu</Text>
      
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text>₹{item.price}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => addToCart(item)}
              style={styles.addButton}
            >
              <Text style={{ color: '#fff' }}>Add +</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {cart.length > 0 && (
        <TouchableOpacity style={styles.checkoutBar}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>
            View Cart ({cart.length} items)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = {
  card: {
    flexDirection: 'row',
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    alignItems: 'center',
    // Neobrutalist shadow
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  image: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
  itemName: { fontSize: 18, fontWeight: '600' },
  addButton: { backgroundColor: '#FF5733', padding: 10, borderRadius: 8 },
  checkoutBar: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center'
  }
};