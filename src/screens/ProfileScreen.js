import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Linking, Platform } from 'react-native';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import * as Location from 'expo-location';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [horaServidor, setHoraServidor] = useState('--:--');
  const [clima, setClima] = useState({ temp: '--', desc: 'Sincronizando...' });
  const [tipoCambio, setTipoCambio] = useState('--.--');
  const [eficiencia, setEficiencia] = useState(0);
  const [historial, setHistorial] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeKPI;
    let unsubscribeHistorial;

    const inicializarApp = async () => {
      try {
        // 1. APIs Externas (Hora, Clima, Dólar)
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          fetchClima(loc.coords.latitude, loc.coords.longitude);
        } else { fetchClimaJuarez(); }
        fetchHora();
        fetchDolar();

        const userAuth = auth.currentUser;
        if (userAuth) {
          const idUsuario = userAuth.email.split('@')[0].toUpperCase();
          
          const docSnap = await getDoc(doc(db, "usuarios", idUsuario));
          if (docSnap.exists()) setUserData(docSnap.data());

          // 2. KPI EN TIEMPO REAL (Fixtura activa)
          const qKPI = query(
            collection(db, "registros_escaneo"), 
            where("usuarioId", "==", idUsuario), 
            where("estado", "==", "en_proceso")
          );

          unsubscribeKPI = onSnapshot(qKPI, (snap) => {
            if (!snap.empty) {
                const data = snap.docs[0].data();
                setEficiencia(data.progreso || 0); 
            } else { setEficiencia(0); }
          });

          // 3. HISTORIAL (Fixturas finalizadas)
          const qHistorial = query(
            collection(db, "registros_escaneo"), 
            where("usuarioId", "==", idUsuario), 
            where("estado", "==", "finalizado")
          );

          unsubscribeHistorial = onSnapshot(qHistorial, (snap) => {
            const docs = snap.docs.map(doc => {
              const data = doc.data();
              
              // CORRECCIÓN DE FECHA: Maneja Timestamp de Firebase o String ISO
              let fechaTxt = "Reciente";
              const rawFecha = data.fechaFinalizacion || data.horaInicio || data.fecha;
              
              if (rawFecha) {
                // Si es un Timestamp de Firebase tiene propiedad .seconds
                const d = rawFecha.seconds ? new Date(rawFecha.seconds * 1000) : new Date(rawFecha);
                fechaTxt = d.toLocaleDateString('es-MX'); // Formato México
              }

              return { 
                id: doc.id, 
                ...data, 
                displayFecha: fechaTxt,
                // Busca el nombre en varios campos posibles para evitar vacíos
                displayName: data.proyectoId || data.nombreFixtura || "Fixtura " + doc.id.substring(0,5)
              };
            });

            // Ordenar: Los más recientes primero
            setHistorial(docs.sort((a, b) => b.id.localeCompare(a.id)));
          });
        }
      } catch (e) { console.log(e); } finally { setLoading(false); }
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
        .catch(() => setClima({ temp: 'N/A', desc: 'Conectando...' }));
    };

    const fetchDolar = () => {
      fetch('https://api.exchangerate-api.com/v4/latest/USD')
        .then(res => res.json())
        .then(data => setTipoCambio(data.rates.MXN.toFixed(2)))
        .catch(() => setTipoCambio('18.50'));
    };

    inicializarApp();
    return () => { 
        if (unsubscribeKPI) unsubscribeKPI(); 
        if (unsubscribeHistorial) unsubscribeHistorial(); 
    };
  }, []);

  const abrirManualDrive = async () => {
    try {
      const docSnap = await getDoc(doc(db, "configuracion", "manual"));
      if (docSnap.exists()) {
        let url = docSnap.data().url;
        if (url.includes('drive.google.com')) url = url.replace('/view', '/preview');
        Platform.OS === 'web' ? window.open(url, '_blank') : Linking.openURL(url);
      }
    } catch (e) { Alert.alert("Error", "No se pudo abrir el manual."); }
  };

  if (loading) return <View style={styles.loadingCenter}><ActivityIndicator size="large" color="#2196F3"/></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.label}>TÉCNICO OPERATIVO</Text>
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

      <Text style={styles.sectionTitle}>Dashboard Industrial</Text>
      
      <View style={styles.apiRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>HORA / CLIMA</Text>
          <Text style={styles.val}>{horaServidor} | {clima.temp}°C</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>KPI ACTUAL</Text>
          <Text style={[styles.val, {color: '#2196F3'}]}>{eficiencia}%</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Historial de Fixturas Finalizadas</Text>
      <View style={styles.historialContainer}>
        {historial.length === 0 ? (
          <View style={{padding: 20, alignItems: 'center'}}>
            <Text style={styles.noData}>No hay datos con estado: "finalizado"</Text>
            <Text style={{fontSize: 9, color: '#ddd', marginTop: 5}}>ID: {userData?.numeroReloj}</Text>
          </View>
        ) : (
          historial.map((item, index) => (
            <View key={index} style={styles.historialItem}>
              <View style={{flex: 1}}>
                <Text style={styles.fixName}>{item.displayName}</Text>
                <Text style={styles.fixFecha}>{item.displayFecha}</Text>
              </View>
              <View style={styles.badge}><Text style={styles.badgeText}>LISTO</Text></View>
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
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: { backgroundColor: '#fff', padding: 25, borderRadius: 15, marginTop: 30, elevation: 4, borderLeftWidth: 8, borderLeftColor: '#2196F3' },
  label: { fontSize: 10, color: '#999', fontWeight: 'bold' },
  nameValue: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  rowInfo: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 15 },
  idValue: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  puestoValue: { fontSize: 13, color: '#2196F3', fontWeight: 'bold', textTransform: 'uppercase' },
  sectionTitle: { marginVertical: 15, fontSize: 14, fontWeight: 'bold', color: '#444' },
  apiRow: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 15, width: '48%', alignItems: 'center', elevation: 2 },
  cardLabel: { fontSize: 9, color: '#888', fontWeight: 'bold' },
  val: { fontSize: 16, fontWeight: 'bold' },
  historialContainer: { backgroundColor: '#fff', borderRadius: 15, padding: 5, elevation: 2 },
  historialItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  fixName: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  fixFecha: { fontSize: 11, color: '#999' },
  badge: { backgroundColor: '#E8F5E9', padding: 5, borderRadius: 5 },
  badgeText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 9 },
  noData: { textAlign: 'center', color: '#bbb', fontSize: 12 },
  manualCard: { backgroundColor: '#fff', marginTop: 20, padding: 20, borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  manualIcon: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  manualTitle: { fontSize: 16, fontWeight: 'bold' },
  manualSub: { fontSize: 12, color: '#999' },
  logoutBtn: { backgroundColor: '#333', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30, marginBottom: 50 }
});