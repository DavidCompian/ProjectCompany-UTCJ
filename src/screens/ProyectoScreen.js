import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function ProyectoScreen({ route, navigation }) {
  const { proyectoId, logId } = route.params || { proyectoId: "N/A", logId: null };
  
  // Estado para los checks de validación
  const [checks, setChecks] = useState({
    limpieza: false,
    sensores: false,
    ajuste: false,
    seguridad: false
  });

  const toggleCheck = (key) => {
    setChecks({ ...checks, [key]: !checks[key] });
  };

  // Solo habilitar si todo está marcado
  const formularioValido = checks.limpieza && checks.sensores && checks.ajuste && checks.seguridad;

  const guardarYFinalizar = async () => {
    if (!logId) return;
    try {
      const docRef = doc(db, "registros_escaneo", logId);
      
      await updateDoc(docRef, {
        estado: "finalizado",
        progreso: 100,
        fechaFinalizacion: new Date().toISOString(),
        validado: true
      });

      // Navegamos al perfil
      navigation.navigate('Perfil');

      // Alerta de éxito un poco después
      setTimeout(() => {
        Alert.alert("Éxito", "Mantenimiento guardado en el historial.");
      }, 600);

    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con la base de datos.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.cardInfo}>
        <Text style={styles.label}>ORDEN ACTIVA</Text>
        <Text style={styles.proyectoTitle}>{proyectoId}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>EN PROCESO</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Validación de Calidad</Text>
      
      <View style={styles.checklistCard}>
        {[
          { id: 'limpieza', t: 'Limpieza de residuos' },
          { id: 'sensores', t: 'Prueba de sensores' },
          { id: 'ajuste', t: 'Ajuste de tornillería' },
          { id: 'seguridad', t: 'Inspección de seguridad' }
        ].map(item => (
          <TouchableOpacity key={item.id} style={styles.checkRow} onPress={() => toggleCheck(item.id)}>
            <View style={[styles.checkbox, checks[item.id] && styles.checked]}>
              {checks[item.id] && <Text style={styles.checkMark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>{item.t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.btnGuardar, !formularioValido && styles.btnDisabled]}
        disabled={!formularioValido}
        onPress={guardarYFinalizar}
      >
        <Text style={styles.btnText}>CONFIRMAR Y FINALIZAR</Text>
      </TouchableOpacity>
      
      {!formularioValido && <Text style={styles.aviso}>* Marque todos los puntos para finalizar</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f8f9fa', alignItems: 'center' },
  cardInfo: { backgroundColor: '#fff', width: '100%', padding: 25, borderRadius: 20, alignItems: 'center', elevation: 3, marginTop: 20 },
  label: { fontSize: 10, color: '#999', fontWeight: 'bold' },
  proyectoTitle: { fontSize: 26, fontWeight: 'bold', marginVertical: 8 },
  badge: { backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#FF9800', fontWeight: 'bold', fontSize: 10 },
  sectionTitle: { alignSelf: 'flex-start', marginTop: 30, marginBottom: 10, fontWeight: 'bold', color: '#444' },
  checklistCard: { backgroundColor: '#fff', width: '100%', borderRadius: 15, padding: 10, elevation: 2 },
  checkRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: '#2196F3', borderRadius: 6, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  checked: { backgroundColor: '#2196F3' },
  checkMark: { color: '#fff', fontWeight: 'bold' },
  checkLabel: { color: '#444', fontSize: 15 },
  btnGuardar: { backgroundColor: '#4CAF50', width: '100%', padding: 20, borderRadius: 15, marginTop: 30, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#ccc' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  aviso: { marginTop: 10, color: '#999', fontSize: 12 }
});