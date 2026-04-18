import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useFocusEffect } from '@react-navigation/native';

export default function ScannerScreen({ navigation, setHasScanned }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  
  // REF DE SEGURIDAD: Este es el "candado" físico que impide duplicados 
  // incluso si el estado de React tarda un milisegundo en actualizarse.
  const isProcessing = useRef(false);

  // Reiniciar estados cuando la pantalla vuelve a estar enfocada
  useFocusEffect(
    useCallback(() => {
      setLoading(false);
      isProcessing.current = false;
    }, [])
  );

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
    // BLOQUEO CRÍTICO: Si ya está procesando, ignora cualquier otro código
    if (loading || isProcessing.current) return;
    
    isProcessing.current = true; // Bloqueo inmediato
    setLoading(true);

    try {
      const userAuth = auth.currentUser;
      const idUsuario = userAuth?.email ? userAuth.email.split('@')[0].toUpperCase() : "USER_INV";

      console.log("Registrando escaneo único para:", data);

      // 1. Crear UN SOLO registro en Firestore
      const docRef = await addDoc(collection(db, 'registros_escaneo'), {
        usuarioId: idUsuario,
        proyectoId: data,
        horaInicio: serverTimestamp(),
        estado: 'en_proceso',
        progreso: 0 // Iniciamos en 0 para que se vea en el Perfil
      });

      // 2. ACTIVAR LA PESTAÑA en el Navigator
      setHasScanned(true); 

      // 3. NAVEGACIÓN
      // Usamos replace o un navigate limpio para evitar que el usuario regrese 
      // y se dispare el escaneo otra vez por error
      setTimeout(() => {
        navigation.navigate('Proyecto', { 
          proyectoId: data, 
          logId: docRef.id 
        });
      }, 100);

    } catch (e) {
      console.log("Error al iniciar escaneo:", e);
      Alert.alert("Error de Sistema", "No se pudo registrar la fixtura. Reintente.");
      
      // Si falla, liberamos los bloqueos para permitir otro intento
      isProcessing.current = false;
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        // Si loading es true, pasamos undefined para apagar el sensor por completo
        onBarcodeScanned={loading ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        style={StyleSheet.absoluteFillObject}
      />
      
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
              <Text style={styles.text}>Procesando fixtura...</Text>
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
  
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  scanBox: { width: 240, height: 240, backgroundColor: 'transparent', position: 'relative' },
  
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#2196F3' },
  tl: { top: 0, left: 0, borderLeftWidth: 6, borderTopWidth: 6 },
  tr: { top: 0, right: 0, borderRightWidth: 6, borderTopWidth: 6 },
  bl: { bottom: 0, left: 0, borderLeftWidth: 6, borderBottomWidth: 6 },
  br: { bottom: 0, right: 0, borderRightWidth: 6, borderBottomWidth: 6 },

  textContainer: { marginTop: 40, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 25, paddingVertical: 15, borderRadius: 30 },
  text: { color: 'white', fontWeight: 'bold', fontSize: 14, textAlign: 'center' }
});