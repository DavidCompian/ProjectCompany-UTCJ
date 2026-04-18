import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function ProjectDetailScreen({ route, navigation, setHasScanned }) {
  // Recibimos los datos de la fixtura escaneada
  const { proyectoId, logId } = route.params || { proyectoId: "FIXTURA DESCONOCIDA", logId: null };
  
  // --- LÓGICA DEL CRONÓMETRO ---
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSegundos(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const seg = s % 60;
    return `${m}:${seg < 10 ? '0' : ''}${seg}`;
  };

  // --- LÓGICA DEL CHECKLIST ---
  const [checks, setChecks] = useState({
    limpieza: false,
    sensores: false,
    ajuste: false,
    seguridad: false
  });

  // --- LÓGICA DE COMENTARIOS TÉCNICOS ---
  const [comentarios, setComentarios] = useState({
    limpieza: '',
    sensores: '',
    ajuste: '',
    seguridad: ''
  });

  // Actualiza el Check y el KPI en Firebase
  const toggleCheck = async (key) => {
    const nuevosChecks = { ...checks, [key]: !checks[key] };
    setChecks(nuevosChecks);

    let marcados = 0;
    Object.values(nuevosChecks).forEach(val => { if(val) marcados++; });
    const nuevoKPI = marcados * 25;

    if (logId) {
      try {
        await updateDoc(doc(db, "registros_escaneo", logId), { progreso: nuevoKPI });
      } catch (e) { 
        console.log("Error actualizando KPI en vivo:", e); 
      }
    }
  };

  const formularioValido = checks.limpieza && checks.sensores && checks.ajuste && checks.seguridad;

  // Botón Final
  const finalizarYGuardar = async () => {
    if (!logId) {
      Alert.alert("Error", "No hay registro activo.");
      return;
    }

    try {
      // Guardamos todo el paquete de datos del mantenimiento
      await updateDoc(doc(db, "registros_escaneo", logId), {
        estado: "finalizado",
        progreso: 100,
        horaFin: new Date().toISOString(), // Necesario para calcular el tiempo en el historial
        duracionSegundos: segundos, // Tiempo total en formato numérico
        comentariosTecnicos: comentarios, // Objeto con las observaciones del técnico
        validado: true
      });

      // 1. Ocultamos la pestaña del menú inferior
      if (typeof setHasScanned === 'function') {
        setHasScanned(false);
      }
      
      // 2. Mandamos al usuario de vuelta a su Perfil
      navigation.navigate('Perfil');
      
      // 3. Alerta de éxito
      setTimeout(() => {
        Alert.alert("Trabajo Terminado", `Mantenimiento exitoso. Tiempo: ${formatTime(segundos)}`);
      }, 500);

    } catch (error) {
      Alert.alert("Error", "No se pudo sincronizar el reporte con la base de datos.");
    }
  };

  // Lista de puntos de inspección
  const itemsInspeccion = [
    { id: 'limpieza', titulo: 'Limpieza profunda de residuos' },
    { id: 'sensores', titulo: 'Prueba y calibración de sensores' },
    { id: 'ajuste', titulo: 'Ajuste de tornillería y bases' },
    { id: 'seguridad', titulo: 'Inspección final de seguridad' }
  ];

  return (
    // EL ARREGLO ESTÁ AQUÍ: Envolvemos todo en KeyboardAvoidingView
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#f0f2f5' }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0} // Compensa la altura de tu barra de navegación superior
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled" // Permite tocar los checks incluso si el teclado está abierto
      >
        
        {/* SECCIÓN DEL CRONÓMETRO */}
        <View style={styles.timerCircle}>
          <Text style={styles.timerText}>{formatTime(segundos)}</Text>
          <Text style={styles.timerLabel}>TIEMPO ACTIVO</Text>
        </View>

        {/* INFORMACIÓN DE LA ORDEN */}
        <View style={styles.cardInfo}>
          <Text style={styles.label}>ORDEN DE MANTENIMIENTO ACTIVA</Text>
          <Text style={styles.proyectoTitle}>{proyectoId}</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>EN PROCESO</Text></View>
        </View>

        <Text style={styles.sectionTitle}>Checklist y Observaciones</Text>
        
        {/* LISTA DE PUNTOS CON COMENTARIOS */}
        <View style={styles.checklistCard}>
          {itemsInspeccion.map(item => (
            <View key={item.id} style={styles.itemContainer}>
              <TouchableOpacity style={styles.checkRow} onPress={() => toggleCheck(item.id)}>
                <View style={[styles.checkbox, checks[item.id] && styles.checked]}>
                  {checks[item.id] && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.checkLabel}>{item.titulo}</Text>
              </TouchableOpacity>
              
              {/* CAMPO DE TEXTO PARA EVIDENCIA/COMENTARIO */}
              <TextInput
                style={styles.inputComentario}
                placeholder="Agregar observación técnica (opcional)..."
                value={comentarios[item.id]}
                onChangeText={(txt) => setComentarios({...comentarios, [item.id]: txt})}
                placeholderTextColor="#bbb"
              />
            </View>
          ))}
        </View>

        {/* BOTÓN DE GUARDADO */}
        <TouchableOpacity 
          style={[styles.btnFinalizar, !formularioValido && styles.btnDisabled]}
          disabled={!formularioValido}
          onPress={finalizarYGuardar}
        >
          <Text style={styles.btnText}>GUARDAR REPORTE TÉCNICO</Text>
        </TouchableOpacity>
        
        {!formularioValido && <Text style={styles.aviso}>* Marque todos los puntos para finalizar</Text>}
        
        {/* Espaciado extra al final para scrollear cómodamente cuando el teclado esté abierto */}
        <View style={{height: 60}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center', flexGrow: 1 },
  
  timerCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 5, borderColor: '#2196F3', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', elevation: 5, marginTop: 10, marginBottom: 20 },
  timerText: { fontSize: 32, fontWeight: 'bold', color: '#333' },
  timerLabel: { fontSize: 9, color: '#999', fontWeight: 'bold', marginTop: 5 },
  
  cardInfo: { backgroundColor: '#fff', width: '100%', padding: 20, borderRadius: 15, alignItems: 'center', elevation: 2, marginBottom: 10 },
  label: { fontSize: 10, color: '#999', fontWeight: 'bold' },
  proyectoTitle: { fontSize: 22, fontWeight: 'bold', marginVertical: 8, color: '#333' },
  badge: { backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  badgeText: { color: '#FF9800', fontWeight: 'bold', fontSize: 10 },
  
  sectionTitle: { alignSelf: 'flex-start', marginTop: 15, marginBottom: 10, fontWeight: 'bold', color: '#444', fontSize: 16 },
  
  checklistCard: { backgroundColor: '#fff', width: '100%', borderRadius: 15, padding: 5, elevation: 2 },
  itemContainer: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5', paddingBottom: 15, paddingTop: 5 },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: '#2196F3', borderRadius: 6, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  checked: { backgroundColor: '#2196F3' },
  checkMark: { color: '#fff', fontWeight: 'bold' },
  checkLabel: { color: '#333', fontSize: 14, fontWeight: '600', flex: 1 },
  
  inputComentario: { backgroundColor: '#fcfcfc', marginHorizontal: 15, padding: 12, borderRadius: 8, fontSize: 13, color: '#555', borderWidth: 1, borderColor: '#eee' },
  
  btnFinalizar: { backgroundColor: '#4CAF50', width: '100%', padding: 18, borderRadius: 12, marginTop: 25, alignItems: 'center', elevation: 2 },
  btnDisabled: { backgroundColor: '#ccc', elevation: 0 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  aviso: { marginTop: 12, color: '#F44336', fontSize: 12, fontWeight: 'bold' }
});