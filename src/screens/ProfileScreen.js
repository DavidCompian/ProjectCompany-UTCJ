import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Linking, Platform, Image } from 'react-native';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import * as Location from 'expo-location';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [horaServidor, setHoraServidor] = useState('--:--');
  const [clima, setClima] = useState({ temp: '--', desc: 'Sincronizando...' });
  const [tipoCambio, setTipoCambio] = useState('--.--');
  const [eficiencia, setEficiencia] = useState(0);
  const [historial, setHistorial] = useState([]); // Nuevo: Estado para el historial
  const [loading, setLoading] = useState(true);

  const META_DIARIA = 10;

  useEffect(() => {
    let unsubscribeKPI;
    let unsubscribeHistorial;

    const inicializarApp = async () => {
      try {
        // Permisos de ubicación para Clima
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          fetchClima(loc.coords.latitude, loc.coords.longitude);
        } else {
          fetchClimaJuarez();
        }

        const userAuth = auth.currentUser;
        if (userAuth) {
          const idUsuario = userAuth.email.split('@')[0].toUpperCase();
          const docSnap = await getDoc(doc(db, "usuarios", idUsuario));
          if (docSnap.exists()) setUserData(docSnap.data());

          // 1. KPI DE FIXTURA ACTUAL (Solo lo que está 'en_proceso')
          const qKPI = query(collection(db, "registros_escaneo"), where("usuarioId", "==", idUsuario), where("estado", "==", "en_proceso"));
          unsubscribeKPI = onSnapshot(qKPI, (snap) => {
            if (!snap.empty) {
                const data = snap.docs[0].data();
                setEficiencia(data.progreso || 0); // Asumiendo que guardas progreso en el documento
            } else {
                setEficiencia(0); // Se reinicia si no hay nada activo
            }
          });

          // 2. HISTORIAL DE REPARACIONES (Todo lo 'finalizado')
          const qHistorial = query(
            collection(db, "registros_escaneo"), 
            where("usuarioId", "==", idUsuario), 
            where("estado", "==", "finalizado"),
            orderBy("fechaFinalizacion", "desc")
          );
          unsubscribeHistorial = onSnapshot(qHistorial, (snap) => {
            const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHistorial(docs);
          });
        }

        fetchHora();
        fetchDolar();
      } catch (e) { 
        console.log("Error inicialización:", e); 
      } finally { 
        setLoading(false); 
      }
    };

    const fetchHora = () => {
      fetch('https://worldtimeapi.org/api/timezone/America/Chihuahua')
        .then(res => res.json())
        .then(data => setHoraServidor(new Date(data.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })))
        .catch(() => setHoraServidor(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })));
    };

    const fetchClima = (lat, lon) => {
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=8f273295b95f9c4d2847d0d04c407519&units=metric&lang=es`)
        .then(res => res.json())
        .then(data => setClima({ temp: Math.round(data.main.temp), desc: data.weather[0].description }))
        .catch(() => fetchClimaJuarez());
    };

    const fetchClimaJuarez = () => {
      fetch('https://api.openweathermap.org/data/2.5/weather?q=Ciudad+Juarez,MX&appid=8f273295b95f9c4d2847d0d04c407519&units=metric&lang=es')
        .then(res => res.json())
        .then(data => setClima({ temp: Math.round(data.main.temp), desc: data.weather[0].description }))
        .catch(() => setClima({ temp: 'N/A', desc: 'Desconectado' }));
    };

    const fetchDolar = () => {
      fetch('https://api.exchangerate-api.com/v4/latest/USD')
        .then(res => res.json())
        .then(data => setTipoCambio(data.rates.MXN.toFixed(2)))
        .catch(() => setTipoCambio('18.50'));
    };

    inicializarApp();
    return () => {
        unsubscribeKPI && unsubscribeKPI();
        unsubscribeHistorial && unsubscribeHistorial();
    };
  }, []);

  const abrirManualDrive = async () => {
    try {
      const docSnap = await getDoc(doc(db, "configuracion", "manual"));
      if (docSnap.exists()) {
        let url = docSnap.data().url;
        if (url.includes('drive.google.com')) {
           url = url.replace('/view', '/preview');
        }
        if (Platform.OS === 'web') {
          const win = window.open(url, '_blank');
          if (win) win.focus();
        } else {
          await Linking.openURL(url);
        }
      } else {
        Alert.alert("Aviso", "Manual no configurado.");
      }
    } catch (e) { Alert.alert("Error", "No se pudo abrir el manual."); }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#2196F3"/></View>;

  return (
    <ScrollView style={styles.container}>
      {/* HEADER CON LOGO Y PERFIL */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
            <Image source={require('../assets/logo.png')} style={styles.logoPerfil} />
            <View style={{flex: 1, marginLeft: 15}}>
                <Text style={styles.label}>TÉCNICO OPERATIVO</Text>
                <Text style={styles.nameValue}>{userData?.nombre || "Usuario Sistema"}</Text>
            </View>
        </View>
        <View style={styles.rowInfo}>
          <View>
            <Text style={styles.label}>ID EMPLEADO</Text>
            <Text style={styles.idValue}>{userData?.numeroReloj || "S/N"}</Text>
          </View>
          <View style={{alignItems: 'flex-end'}}>
            <Text style={styles.label}>PUESTO</Text>
            <Text style={styles.puestoValue}>{userData?.puesto || "Mantenimiento"}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Dashboard de Control</Text>
      
      <View style={styles.apiRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>HORA / CLIMA</Text>
          <Text style={styles.val}>{horaServidor} | {clima.temp}°C</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>KPI FIXTURA ACTUAL</Text>
          <Text style={[styles.val, {color: '#2196F3'}]}>{eficiencia}%</Text>
        </View>
      </View>

      {/* SECCIÓN DE HISTORIAL */}
      <Text style={styles.sectionTitle}>Historial de Fixturas</Text>
      <View style={styles.historialContainer}>
        {historial.length === 0 ? (
          <Text style={styles.noDataText}>No hay registros finalizados.</Text>
        ) : (
          historial.map((item, index) => (
            <View key={index} style={styles.historialItem}>
              <View>
                <Text style={styles.historialFix}>{item.nombreFixtura || "Fixtura Terminar"}</Text>
                <Text style={styles.historialFecha}>{new Date(item.fechaFinalizacion).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.historialKpi}>100%</Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.manualCard} onPress={abrirManualDrive}>
        <View style={styles.manualIcon}><Text style={{color: '#fff', fontWeight: 'bold'}}>PDF</Text></View>
        <View style={{flex: 1}}>
            <Text style={styles.manualTitle}>Manual de Procedimientos</Text>
            <Text style={styles.manualSub}>Toque para abrir el visor técnico</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => { auth.signOut(); navigation.replace('Login'); }}>
        <Text style={{color: '#fff', fontWeight: 'bold'}}>CERRAR SESIÓN SEGURA</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 20 },
  loading: { flex: 1, justifyContent: 'center' },
  headerCard: { backgroundColor: '#fff', padding: 25, borderRadius: 15, marginTop: 30, elevation: 4, borderLeftWidth: 8, borderLeftColor: '#2196F3' },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  logoPerfil: { width: 60, height: 60, borderRadius: 10, resizeMode: 'contain' },
  label: { fontSize: 10, color: '#999', fontWeight: 'bold' },
  nameValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  rowInfo: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  idValue: { fontSize: 16, fontWeight: 'bold' },
  puestoValue: { fontSize: 13, color: '#2196F3', fontWeight: 'bold', textTransform: 'uppercase' },
  sectionTitle: { marginVertical: 15, fontSize: 14, fontWeight: 'bold', color: '#444' },
  apiRow: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 15, width: '48%', alignItems: 'center', elevation: 2 },
  cardLabel: { fontSize: 10, color: '#888', fontWeight: 'bold', marginBottom: 5 },
  val: { fontSize: 16, fontWeight: 'bold' },
  historialContainer: { backgroundColor: '#fff', borderRadius: 15, padding: 10, elevation: 2 },
  historialItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  historialFix: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  historialFecha: { fontSize: 11, color: '#999' },
  historialKpi: { color: '#4CAF50', fontWeight: 'bold' },
  noDataText: { textAlign: 'center', color: '#bbb', padding: 10 },
  manualCard: { backgroundColor: '#fff', marginTop: 20, padding: 20, borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  manualIcon: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  manualTitle: { fontSize: 16, fontWeight: 'bold' },
  manualSub: { fontSize: 12, color: '#999' },
  logoutBtn: { backgroundColor: '#333', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30, marginBottom: 50 }
});