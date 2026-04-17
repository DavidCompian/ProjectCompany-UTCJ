import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function ProjectDetailScreen({ route, navigation, setHasScanned }) {
  const { proyectoId, logId } = route.params || {};
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSegundos(s => s + 1), 1000);
    return () => clearInterval(timer); // Limpieza al salir
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const seg = s % 60;
    return `${m}:${seg < 10 ? '0' : ''}${seg}`;
  };

  const finalizarProceso = async () => {
    try {
      const docRef = doc(db, 'registros_escaneo', logId);
      await updateDoc(docRef, {
        horaFin: serverTimestamp(),
        duracion: segundos,
        estado: 'finalizado'
      });

      Alert.alert("Éxito", "Mantenimiento registrado correctamente.");
      
      // ACCIÓN CLAVE: Ocultamos la pestaña y volvemos al perfil
      setHasScanned(false);
      navigation.navigate('Perfil');

    } catch (e) {
      Alert.alert("Error", "No se pudo cerrar el registro");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>REPARACIÓN EN CURSO</Text>
      <Text style={styles.idText}>{proyectoId}</Text>
      
      <View style={styles.timerCircle}>
        <Text style={styles.time}>{formatTime(segundos)}</Text>
        <Text style={styles.subTime}>TIEMPO TRANSCURRIDO</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={finalizarProceso}>
        <Text style={styles.btnText}>TERMINAR Y GUARDAR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  header: { fontSize: 12, color: '#2196F3', fontWeight: 'bold', letterSpacing: 2 },
  idText: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, color: '#333' },
  timerCircle: { 
    width: 240, height: 240, borderRadius: 120, borderWidth: 10, 
    borderColor: '#2196F3', justifyContent: 'center', alignItems: 'center' 
  },
  time: { fontSize: 50, fontWeight: 'bold', color: '#333' },
  subTime: { fontSize: 10, color: '#aaa', fontWeight: 'bold' },
  btn: { backgroundColor: '#333', padding: 20, borderRadius: 15, marginTop: 50, width: '80%', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});