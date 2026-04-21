import React, { useState } from 'react';
import SplashScreen from '../components/SplashScreen';
import { Text, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Scan } from 'lucide-react-native';

export default function ScannerScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
          We need your camera to scan the table QR code!
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!data || scanned) return;
    setScanned(true);

    // 🛡️ SECURITY GATE: Ask for confirmation before leaving the scanner
    // This prevents "ghost scans" from jumping to the menu accidentally.
    Alert.alert(
      "Table Detected! 🍽️",
      `Would you like to enter the menu for ${data}?`,
      [
        {
          text: "Cancel",
          onPress: () => setScanned(false), // Reactivate scanner
          style: "cancel"
        },
        {
          text: "Enter Menu",
          onPress: () => {
            router.push({
              pathname: "/menu",
              params: { tableId: data }
            });
            // Keep scanned=true for a bit longer to prevent immediate re-trigger
            setTimeout(() => setScanned(false), 2000);
          },
          style: "default"
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SmartDine</Text>
        <Text style={styles.subtitle}>Scan Table QR to Begin</Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={styles.camera}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.reserveButton}
          onPress={() => router.push('/reservations')}
        >
          <Text style={styles.reserveButtonText}>📅 Book a Table</Text>
        </TouchableOpacity>
        <Scan {...({ stroke: "#000", size: 32 } as any)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { marginTop: 80, paddingHorizontal: 30, marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 16, color: '#666' },
  cameraContainer: {
    width: 280,
    height: 280,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#000',
  },
  camera: { flex: 1 },
  button: { backgroundColor: '#000', padding: 15, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  footer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  reserveButton: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20
  },
  reserveButtonText: { fontSize: 14, fontWeight: '700', color: '#111827' }
});