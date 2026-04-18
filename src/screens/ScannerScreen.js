import React, { useState } from 'react';
import { View, StyleSheet, Text, Button, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function ScannerScreen({ navigation, setHasScanned }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Se necesita permiso para la cámara</Text>
        <Button onPress={requestPermission} title="Conceder Permiso" />
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    
    console.log("Código escaneado:", data);

    // 1. Activamos la pestaña 'Proyecto' en el Navigator
    setHasScanned(true);

    // 2. Esperamos a que el Navigator registre la nueva pantalla antes de navegar
    setTimeout(() => {
      navigation.navigate('Proyecto', { qrData: data });
    }, 200); 
  };

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && (
        <View style={styles.buttonContainer}>
          <Button title={'Escanear de nuevo'} onPress={() => setScanned(false)} color="#2196F3" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  text: { color: '#fff', textAlign: 'center', marginTop: 50 },
  buttonContainer: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 5 }
});