import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera'; // Si usas la versión nueva de Expo

export default function ScannerScreen({ navigation, setHasScanned }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // 1. Pedir permisos al entrar
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>Necesitamos permiso para usar la cámara</Text>
        <Button onPress={requestPermission} title="Dar Permiso" />
      </View>
    );
  }

  // 2. Esta es la función que se activa al detectar el QR
  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return; // Si ya escaneó, no hagas nada
    
    setScanned(true); // Bloqueamos nuevas lecturas
    console.log("¡QR Detectado!", data);
    
    // Aquí mandamos la señal a la navegación para que aparezca la pestaña "Proyecto"
    setHasScanned(true); 
    
    Alert.alert("Éxito", "Código detectado correctamente");
    
    // Navegamos a la pantalla de detalles
    navigation.navigate('Proyecto', { qrData: data });
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        // PROPIEDAD CLAVE: Solo QR
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        // FUNCIÓN CLAVE: Qué hacer al leer
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      
      {scanned && (
        <Button title={'Escanear de nuevo'} onPress={() => setScanned(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
});