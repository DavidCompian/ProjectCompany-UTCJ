import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

export default function ScannerScreen({ navigation, setHasScanned }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);

  // Verificación de permisos de cámara
  if (!permission?.granted) {
    return (
      <View style={styles.containerPermission}>
        <Text style={styles.permissionText}>Se requiere acceso a la cámara para escanear fixturas.</Text>
        <TouchableOpacity style={styles.btnPermission} onPress={requestPermission}>
            <Text style={styles.btnText}>OTORGAR PERMISO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }) => {
    // Evita escaneos múltiples si ya está cargando
    if (loading) return;
    
    setLoading(true);
    try {
      const userAuth = auth.currentUser;
      const idUsuario = userAuth?.email.split('@')[0].toUpperCase() || "USER_INV";

      // 1. Crear el registro oficial de inicio en Firestore
      const docRef = await addDoc(collection(db, 'registros_escaneo'), {
        usuarioId: idUsuario,
        proyectoId: data,
        horaInicio: serverTimestamp(),
        estado: 'en_proceso'
      });

      // 2. ACTIVAR LA PESTAÑA: Informamos al AppNavigator que ya puede mostrar "Proyecto"
      setHasScanned(true); 

      // 3. NAVEGACIÓN SEGURA: 
      // Usamos un pequeño retraso de 150ms para que el Tab Navigator 
      // renderice la pestaña antes de que intentemos navegar a ella.
      setTimeout(() => {
        navigation.navigate('Proyecto', { 
          proyectoId: data, 
          logId: docRef.id 
        });
      }, 150);

    } catch (e) {
      console.log("Error al iniciar escaneo:", e);
      Alert.alert("Error de Sistema", "No se pudo registrar el inicio de la fixtura.");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={loading ? undefined : handleBarCodeScanned}
        barcodeSettings={{ barcodeTypes: ["qr"] }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Guía visual para el técnico */}
      <View style={styles.overlay}>
        <View style={styles.scanBox}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
        </View>

        <View style={styles.textContainer}>
          {loading ? (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <ActivityIndicator size="small" color="#fff" style={{marginRight: 10}} />
              <Text style={styles.text}>Sincronizando tiempo...</Text>
            </View>
          ) : (
            <Text style={styles.text}>Enfoque el código QR de la Fixtura</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  containerPermission: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 20 },
  permissionText: { textAlign: 'center', marginBottom: 20, fontSize: 16, color: '#666' },
  btnPermission: { backgroundColor: '#2196F3', padding: 15, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  scanBox: { width: 220, height: 220, backgroundColor: 'transparent', position: 'relative' },
  
  // Esquinas decorativas para el escáner
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#2196F3', borderWeight: 5 },
  tl: { top: 0, left: 0, borderLeftWidth: 5, borderTopWidth: 5 },
  tr: { top: 0, right: 0, borderRightWidth: 5, borderTopWidth: 5 },
  bl: { bottom: 0, left: 0, borderLeftWidth: 5, borderBottomWidth: 5 },
  br: { bottom: 0, right: 0, borderRightWidth: 5, borderBottomWidth: 5 },

  textContainer: { marginTop: 40, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  text: { color: 'white', fontWeight: 'bold', fontSize: 14 }
});