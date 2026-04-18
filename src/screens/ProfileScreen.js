import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Alert, Platform } from 'react-native';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import * as Location from 'expo-location'; // Necesario para permisos de clima

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [horaServidor, setHoraServidor] = useState('--:--');
  const [clima, setClima] = useState({ temp: '--', desc: 'Sincronizando...' });
  const [tipoCambio, setTipoCambio] = useState('--.--');
  const [eficiencia, setEficiencia] = useState(0);
  const [loading, setLoading] = useState(true);
  const [manualVisible, setManualVisible] = useState(false);
  const [contenidoManual, setContenidoManual] = useState('');

  const META_DIARIA = 10;

  useEffect(() => {
    let unsubscribeKPI;

    const inicializarDashboard = async () => {
      try {
        // --- 1. SOLICITAR PERMISOS (Ubicación para Clima) ---
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          fetchClimaPorCoordenadas(location.coords.latitude, location.coords.longitude);
        } else {
          // Fallback a Ciudad Juárez si no hay permisos
          fetchClimaGeneral("Ciudad Juarez,MX");
        }

        // --- 2. API FIREBASE (KPIs y Perfil) ---
        const userAuth = auth.currentUser;
        if (userAuth) {
          const idUsuario = userAuth.email.split('@')[0].toUpperCase();
          const docSnap = await getDoc(doc(db, "usuarios", idUsuario));
          if (docSnap.exists()) setUserData(docSnap.data());

          const q = query(collection(db, "registros_escaneo"), where("usuarioId", "==", idUsuario), where("estado", "==", "finalizado"));
          unsubscribeKPI = onSnapshot(q, (snap) => {
            let calculo = (snap.size / META_DIARIA) * 100;
            setEficiencia(calculo > 100 ? 100 : calculo.toFixed(0));
          });
        }

        // --- 3. API HORA (Con Fallback) ---
        fetchHora();

        // --- 4. API TIPO DE CAMBIO ---
        fetchDolar();

      } catch (e) {
        console.log("Error inicialización:", e);
      } finally {
        setLoading(false);
      }
    };

    // Funciones Auxiliares para Limpieza del useEffect
    const fetchHora = () => {
      fetch('https://worldtimeapi.org/api/timezone/America/Chihuahua')
        .then(res => res.json())
        .then(data => {
          const date = new Date(data.datetime);
          setHoraServidor(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        })
        .catch(() => {
          const now = new Date();
          setHoraServidor(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        });
    };

    const fetchClimaPorCoordenadas = (lat, lon) => {
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=8f273295b95f9c4d2847d0d04c407519&units=metric&lang=es`)
        .then(res => res.json())
        .then(data => setClima({ temp: Math.round(data.main.temp), desc: data.weather[0].description }))
        .catch(() => fetchClimaGeneral("Ciudad Juarez,MX"));
    };

    const fetchClimaGeneral = (ciudad) => {
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=8f273295b95f9c4d2847d0d04c407519&units=metric&lang=es`)
        .then(res => res.json())
        .then(data => setClima({ temp: Math.round(data.main.temp), desc: data.weather[0].description }))
        .catch(() => setClima({ temp: '??', desc: 'Sin conexión' }));
    };

    const fetchDolar = () => {
      fetch('https://api.exchangerate-api.com/v4/latest/USD')
        .then(res => res.json())
        .then(data => setTipoCambio(data.rates.MXN.toFixed(2)))
        .catch(() => setTipoCambio('18.50'));
    };

    inicializarDashboard();
    return () => unsubscribeKPI && unsubscribeKPI();
  }, []);

  const abrirManual = async () => {
    setManualVisible(true);
    try {
      const docSnap = await getDoc(doc(db, "configuracion", "manual_texto"));
      if (docSnap.exists()) setContenidoManual(docSnap.data().contenido);
    } catch (e) {
      Alert.alert("Error", "No se pudo cargar el manual.");
    }
  };

  if (loading) return <View style={styles.loadingCenter}><ActivityIndicator size="large" color="#2196F3" /></View>;

  return (
    <ScrollView style={styles.container}>
      {/* CABECERA ESTILO ORIGINAL (Borde azul) */}
      <View style={styles.headerCard}>
        <Text style={styles.label}>TÉCNICO RESPONSABLE</Text>
        <Text style={styles.nameValue}>{userData?.nombre || "Usuario Sistema"}</Text>
        <View style={styles.rowInfo}>
          <View>
            <Text style={styles.label}>NÚMERO DE RELOJ</Text>
            <Text style={styles.idValue}>{userData?.numeroReloj || "S/N"}</Text>
          </View>
          <View style={{alignItems: 'flex-end'}}>
            <Text style={styles.label}>PUESTO</Text>
            <Text style={styles.puestoValue}>{userData?.puesto || "Técnico"}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Dashboard Operativo</Text>
      
      {/* GRID DE MÉTRICAS */}
      <View style={styles.apiRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>HORA OFICIAL</Text>
          <Text style={styles.val}>{horaServidor}</Text>
          <Text style={styles.cardDesc}>Juárez</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>CLIMA ACTUAL</Text>
          <Text style={styles.val}>{clima.temp}°C</Text>
          <Text style={[styles.cardDesc, {textTransform: 'capitalize'}]}>{clima.desc}</Text>
        </View>
      </View>

      <View style={[styles.apiRow, {marginTop: 15}]}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>TIPO DE CAMBIO</Text>
          <Text style={styles.val}>${tipoCambio}</Text>
          <Text style={styles.cardDesc}>USD/MXN</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>EFICIENCIA KPI</Text>
          <Text style={[styles.val, {color: eficiencia >= 90 ? '#4CAF50' : '#FF9800'}]}>{eficiencia}%</Text>
          <Text style={styles.cardDesc}>Firebase</Text>
        </View>
      </View>

      {/* BOTÓN MANUAL CON ICONO ROJO */}
      <TouchableOpacity style={styles.manualCard} onPress={abrirManual}>
        <View style={styles.manualIcon}><Text style={{color: '#fff', fontWeight: 'bold'}}>DOC</Text></View>
        <View style={{flex: 1}}>
            <Text style={styles.manualTitle}>Manuales Técnicos</Text>
            <Text style={styles.manualSub}>Instrucciones Nativo Firestore</Text>
        </View>
      </TouchableOpacity>

      <Modal visible={manualVisible} animationType="slide">
        <View style={styles.modalContent}>
           <Text style={styles.modalHeader}>Guía Técnica</Text>
           <ScrollView style={styles.modalBody}>
              <Text style={styles.manualText}>{contenidoManual || "Cargando contenido..."}</Text>
           </ScrollView>
           <TouchableOpacity style={styles.closeBtn} onPress={() => setManualVisible(false)}>
              <Text style={styles.closeBtnText}>CERRAR MANUAL</Text>
           </TouchableOpacity>
        </View>
      </Modal>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => { auth.signOut(); navigation.replace('Login'); }}>
        <Text style={styles.logoutText}>CERRAR SESIÓN SEGURA</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 20 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: { backgroundColor: '#fff', padding: 25, borderRadius: 15, marginTop: 30, elevation: 4, borderLeftWidth: 8, borderLeftColor: '#2196F3' },
  label: { fontSize: 10, color: '#999', fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
  nameValue: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  rowInfo: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 15 },
  idValue: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  puestoValue: { fontSize: 13, color: '#2196F3', fontWeight: 'bold', textTransform: 'uppercase' },
  sectionTitle: { marginVertical: 20, fontSize: 16, fontWeight: 'bold', color: '#444' },
  apiRow: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, width: '48%', alignItems: 'center', elevation: 2 },
  cardLabel: { fontSize: 10, color: '#888', fontWeight: 'bold', marginBottom: 8 },
  val: { fontSize: 22, fontWeight: 'bold', color: '#2196F3' },
  cardDesc: { fontSize: 9, color: '#bbb', marginTop: 5 },
  manualCard: { backgroundColor: '#fff', marginTop: 20, padding: 20, borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  manualIcon: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#FF5252', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  manualTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  manualSub: { fontSize: 12, color: '#999' },
  logoutBtn: { backgroundColor: '#333', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30, marginBottom: 50 },
  logoutText: { color: 'white', fontWeight: 'bold' },
  modalContent: { flex: 1, backgroundColor: '#fff', padding: 30, paddingTop: 60 },
  modalHeader: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#2196F3' },
  modalBody: { flex: 1, backgroundColor: '#f9f9f9', borderRadius: 10, padding: 15 },
  manualText: { fontSize: 16, color: '#333', lineHeight: 24 },
  closeBtn: { backgroundColor: '#1a237e', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  closeBtnText: { color: '#fff', fontWeight: 'bold' }
});