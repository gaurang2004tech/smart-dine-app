import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function Scanner() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // This function is the "Brain" of the camera
  const handleBarCodeScanned = async (result) => {
    // result.data is the actual text inside the QR code
    const rawData = result.data; 
    
    if (!rawData) {
        Alert.alert("Error", "Camera saw a blank QR code.");
        return;
    }

    setScanned(true);

    // 🌟 THE SCREAM TEST: This proves the camera is working
    Alert.alert("SCANNER SUCCESS", `I read: "${rawData}"`, [
      {
        text: "Save & Go",
        onPress: async () => {
          await AsyncStorage.setItem('currentTable', String(rawData));
          router.replace('/menu');
        }
      }
    ]);
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ marginBottom: 20 }}>Camera permission is required</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      {scanned && (
        <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }
});