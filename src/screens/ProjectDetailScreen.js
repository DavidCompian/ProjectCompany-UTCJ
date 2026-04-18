import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function ProjectDetailScreen({ route, navigation, setHasScanned }) {
  // Recibimos los datos que manda el ScannerScreen
  const { proyectoId, logId } = route.params || {};
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSegundos(s => s + 1), 1000);
    return () => clearInterval(timer); // Limpieza de memoria al salir
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const seg = s % 60;
    return `${m}:${seg < 10 ? '0' : ''}${seg}`;
  };

  const finalizarProceso = async () => {
    if (!logId) {
      Alert.alert("Error", "No se encontró un registro activo.");
      return;
    }

    try {
      const docRef = doc(db, 'registros_escaneo', logId);
      await updateDoc(docRef, {
        horaFin: serverTimestamp(),
        duracion: segundos,
        estado: 'finalizado'
      });

      Alert.alert("ProjectCompany", "Mantenimiento registrado y guardado.");
      
      // 1. Ocultamos la pestaña del menú inferior
      setHasScanned(false);
      
      // 2. Mandamos al usuario de vuelta a su Perfil o al Escáner
      navigation.navigate('Perfil');

    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Hubo un problema al conectar con Firebase.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>TRABAJO EN CURSO</Text>
      <Text style={styles.idText}>{proyectoId || "Sin ID"}</Text>
      
      <View style={styles.timerCircle}>
        <Text style={styles.time}>{formatTime(segundos)}</Text>
        <Text style={styles.subTime}>TIEMPO TRANSCURRIDO</Text>
      </View>

      <TouchableOpacity 
        style={styles.btn} 
        onPress={finalizarProceso}
        activeOpacity={0.7}
      >
        <Text style={styles.btnText}>FINALIZAR Y GUARDAR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  header: { fontSize: 12, color: '#2196F3', fontWeight: 'bold', letterSpacing: 2 },
  idText: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, color: '#333' },
  timerCircle: { 
    width: 240, height: 240, borderRadius: 120, borderWidth: 8, 
    borderColor: '#2196F3', justifyContent: 'center', alignItems: 'center',
    shadowColor: "#2196F3", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5,
  },
  time: { fontSize: 50, fontWeight: 'bold', color: '#333' },
  subTime: { fontSize: 10, color: '#aaa', fontWeight: 'bold' },
  btn: { 
    backgroundColor: '#333', padding: 20, borderRadius: 15, 
    marginTop: 50, width: '80%', alignItems: 'center',
    elevation: 5
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});