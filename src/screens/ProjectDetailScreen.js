import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function ProjectDetailScreen({ route, navigation, setHasScanned }) {
  const { proyectoId, logId } = route.params || { proyectoId: "FIXTURA DESCONOCIDA", logId: null };
  const [segundos, setSegundos] = useState(0);

  // Estados: 0 = No revisado, 1 = OK (Verde), 2 = Pendiente/Falla (Naranja)
  const [estados, setEstados] = useState({
    limpieza: 0,
    sensores: 0,
    ajuste: 0,
    seguridad: 0
  });

  const [comentarios, setComentarios] = useState({
    limpieza: '',
    sensores: '',
    ajuste: '',
    seguridad: ''
  });

  useEffect(() => {
    const timer = setInterval(() => setSegundos(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const seg = s % 60;
    return `${m}:${seg < 10 ? '0' : ''}${seg}`;
  };

  // Función para ciclar entre los 3 estados
  const cambiarEstado = async (key) => {
    let proximo = (estados[key] + 1) % 3;
    const nuevosEstados = { ...estados, [key]: proximo };
    setEstados(nuevosEstados);

    // El KPI ahora es un poco más inteligente
    let completados = Object.values(nuevosEstados).filter(v => v === 1).length;
    let conFalla = Object.values(nuevosEstados).filter(v => v === 2).length;
    const nuevoKPI = (completados + conFalla) * 25; 

    if (logId) {
      try {
        await updateDoc(doc(db, "registros_escaneo", logId), { progreso: nuevoKPI });
      } catch (e) { console.log(e); }
    }
  };

  // VALIDACIÓN CRÍTICA: 
  // 1. Todos los puntos deben estar revisados (no estar en 0).
  // 2. Si hay algún punto en estado 2 (Falla), el comentario de ese punto DEBE tener texto.
  const validarFormulario = () => {
    const llaves = Object.keys(estados);
    const todosRevisados = llaves.every(k => estados[k] !== 0);
    
    const fallasSinComentario = llaves.some(k => 
      estados[k] === 2 && comentarios[k].trim().length < 5
    );

    return todosRevisados && !fallasSinComentario;
  };

  const finalizarYGuardar = async () => {
    if (!logId) return;

    // Verificar si hay alguna falla pendiente para cambiar el estado global
    const hayFallas = Object.values(estados).includes(2);

    try {
      await updateDoc(doc(db, "registros_escaneo", logId), {
        estado: hayFallas ? "finalizado_con_pendientes" : "finalizado",
        progreso: 100,
        horaFin: new Date().toISOString(),
        duracionSegundos: segundos,
        comentariosTecnicos: comentarios,
        mapaEstados: estados, // Guardamos el 1 o 2 de cada punto
        validado: true
      });

      if (typeof setHasScanned === 'function') setHasScanned(false);
      navigation.navigate('Perfil');
      
      Alert.alert(
        hayFallas ? "Reporte con Incidencias" : "Trabajo Limpio",
        hayFallas 
          ? "Se guardó el reporte. Tool Crip será notificado de los repuestos pendientes."
          : "Mantenimiento exitoso sin novedades."
      );
    } catch (error) {
      Alert.alert("Error", "Error al sincronizar.");
    }
  };

  const items = [
    { id: 'limpieza', t: 'Limpieza de residuos' },
    { id: 'sensores', t: 'Calibración de sensores' },
    { id: 'ajuste', t: 'Ajuste de tornillería' },
    { id: 'seguridad', t: 'Inspección de seguridad' }
  ];

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#f0f2f5' }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.timerCircle}>
          <Text style={styles.timerText}>{formatTime(segundos)}</Text>
          <Text style={styles.timerLabel}>TIEMPO ACTIVO</Text>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.label}>ORDEN ACTIVA: {proyectoId}</Text>
          <Text style={styles.instruccion}>Toque el icono para cambiar estado: OK o Pendiente</Text>
        </View>

        <View style={styles.checklistCard}>
          {items.map(item => (
            <View key={item.id} style={styles.itemContainer}>
              <View style={styles.checkRow}>
                <TouchableOpacity 
                  onPress={() => cambiarEstado(item.id)}
                  style={[
                    styles.statusIcon, 
                    estados[item.id] === 1 && styles.bgOk,
                    estados[item.id] === 2 && styles.bgFail
                  ]}
                >
                  <Ionicons 
                    name={estados[item.id] === 1 ? "checkmark-circle" : estados[item.id] === 2 ? "warning" : "ellipse-outline"} 
                    size={28} 
                    color={estados[item.id] === 0 ? "#ccc" : "#fff"} 
                  />
                </TouchableOpacity>
                <Text style={styles.checkLabel}>{item.t}</Text>
                {estados[item.id] === 2 && <Text style={styles.alertText}>REQUERIDO</Text>}
              </View>
              
              <TextInput
                style={[styles.inputComentario, estados[item.id] === 2 && styles.inputError]}
                placeholder={estados[item.id] === 2 ? "MOTIVO DE PENDIENTE (OBLIGATORIO)" : "Observaciones (opcional)"}
                value={comentarios[item.id]}
                onChangeText={(txt) => setComentarios({...comentarios, [item.id]: txt})}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.btnFinalizar, !validarFormulario() && styles.btnDisabled]}
          disabled={!validarFormulario()}
          onPress={finalizarYGuardar}
        >
          <Text style={styles.btnText}>CERRAR REPORTE TÉCNICO</Text>
        </TouchableOpacity>
        
        {!validarFormulario() && (
          <Text style={styles.aviso}>* Complete todos los puntos y justifique los pendientes.</Text>
        )}
        <View style={{height: 60}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center', flexGrow: 1 },
  timerCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#2196F3', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', elevation: 4, marginBottom: 15 },
  timerText: { fontSize: 28, fontWeight: 'bold' },
  timerLabel: { fontSize: 7, color: '#999' },
  cardInfo: { backgroundColor: '#fff', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  instruccion: { fontSize: 10, color: '#666', marginTop: 5 },
  checklistCard: { backgroundColor: '#fff', width: '100%', borderRadius: 15, padding: 5, elevation: 2 },
  itemContainer: { paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  checkRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  statusIcon: { width: 45, height: 45, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9', marginRight: 15 },
  bgOk: { backgroundColor: '#4CAF50' },
  bgFail: { backgroundColor: '#FF9800' },
  checkLabel: { flex: 1, fontWeight: 'bold', color: '#444' },
  alertText: { fontSize: 8, color: '#FF9800', fontWeight: 'bold' },
  inputComentario: { backgroundColor: '#f9f9f9', marginHorizontal: 15, padding: 10, borderRadius: 8, fontSize: 12, borderWidth: 1, borderColor: '#eee' },
  inputError: { borderColor: '#FF9800', backgroundColor: '#FFF3E0' },
  btnFinalizar: { backgroundColor: '#2196F3', width: '100%', padding: 18, borderRadius: 12, marginTop: 20, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#ccc' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  aviso: { marginTop: 10, color: '#F44336', fontSize: 10, fontWeight: 'bold' }
});