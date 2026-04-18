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

// Función para calcular cuánto tardó el técnico (Optimizada para pruebas rápidas)
  const calcularDuracion = (inicio, fin) => {
    if (!inicio || !fin) return "N/A";
    try {
      const d1 = inicio.seconds ? new Date(inicio.seconds * 1000) : new Date(inicio);
      const d2 = fin.seconds ? new Date(fin.seconds * 1000) : new Date(fin);
      const diffMs = Math.abs(d2 - d1);
      const diffMins = Math.round(diffMs / 60000); // Convierte a minutos
      
      // EL TRUCO ESTÁ AQUÍ: Si lo haces rapidísimo, muestra "< 1 min"
      if (diffMins === 0) return "< 1 min"; 
      
      if (diffMins < 60) return `${diffMins} min`;
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hrs}h ${mins}m`;
    } catch (e) {
      return "N/A";
    }
  };

  useEffect(() => {
    let unsubscribeKPI;
    let unsubscribeHistorial;

    const inicializarApp = async () => {
      try {
        // --- 1. APIs EXTERNAS (Requisito RA) ---
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          fetchClima(loc.coords.latitude, loc.coords.longitude);
        } else { fetchClimaJuarez(); }
        fetchHora();
        fetchDolar();

        // --- 2. DATOS DEL USUARIO ---
        const userAuth = auth.currentUser;
        if (userAuth) {
          const idUsuario = userAuth.email.split('@')[0].toUpperCase();
          const docSnap = await getDoc(doc(db, "usuarios", idUsuario));
          if (docSnap.exists()) setUserData(docSnap.data());

          // --- 3. KPI EN TIEMPO REAL ---
          const qKPI = query(
            collection(db, "registros_escaneo"), 
            where("usuarioId", "==", idUsuario), 
            where("estado", "==", "en_proceso")
          );
          unsubscribeKPI = onSnapshot(qKPI, (snap) => {
            if (!snap.empty) {
                setEficiencia(snap.docs[0].data().progreso || 0); 
            } else { setEficiencia(0); }
          });

          // --- 4. HISTORIAL CON CÁLCULO DE TIEMPO ---
          const qHistorial = query(
            collection(db, "registros_escaneo"), 
            where("usuarioId", "==", idUsuario), 
            where("estado", "==", "finalizado")
          );

          unsubscribeHistorial = onSnapshot(qHistorial, (snap) => {
            const docs = snap.docs.map(doc => {
              const data = doc.data();
              let fechaTxt = "Reciente";
              const rawFecha = data.horaFin || data.horaInicio || data.fecha;
              
              if (rawFecha) {
                const d = rawFecha.seconds ? new Date(rawFecha.seconds * 1000) : new Date(rawFecha);
                fechaTxt = d.toLocaleDateString('es-MX'); 
              }

              return { 
                id: doc.id, 
                ...data, 
                displayFecha: fechaTxt,
                displayName: data.proyectoId || data.nombreFixtura || "Fixtura " + doc.id.substring(0,5),
                tiempoTardado: calcularDuracion(data.horaInicio, data.horaFin) // <--- El nuevo tiempo
              };
            });
            setHistorial(docs.sort((a, b) => b.id.localeCompare(a.id)));
          });
        }
      } catch (e) { console.log(e); } finally { setLoading(false); }
    };

    // --- FUNCIONES DE APIs ---
    const fetchHora = () => {
      fetch('https://worldtimeapi.org/api/timezone/America/Chihuahua')
        .then(res => { if (!res.ok) throw new Error('Error de red'); return res.json(); })
        .then(data => {
          const d = new Date(data.datetime);
          setHoraServidor(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        })
        .catch(() => {
          const local = new Date();
          setHoraServidor(local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        });
    };

    const fetchClima = (lat, lon) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        .then(res => res.json())
        .then(data => {
          if (data.current_weather) setClima({ temp: Math.round(data.current_weather.temperature), desc: "Local" });
        }).catch(() => setClima({ temp: 'N/A', desc: 'Error' }));
    };

    const fetchClimaJuarez = () => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=31.7333&longitude=-106.4833&current_weather=true`)
        .then(res => res.json())
        .then(data => {
          if (data.current_weather) setClima({ temp: Math.round(data.current_weather.temperature), desc: "Juárez" });
        }).catch(() => setClima({ temp: 'N/A', desc: 'Error' }));
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

  const cerrarSesion = () => {
    auth.signOut(); 
    navigation.replace('Login');
  };

  if (loading) return <View style={styles.loadingCenter}><ActivityIndicator size="large" color="#2196F3"/></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f2f5' }}>
      
      {/* BARRA SUPERIOR (Cerrar Sesión) */}
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>Perfil</Text>
        <TouchableOpacity style={styles.logoutTopBtn} onPress={cerrarSesion}>
          <Text style={styles.logoutTopText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        {/* TARJETA DE USUARIO */}
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

        {/* DASHBOARD DE APIs (Grid de 4 recuadros) */}
        <Text style={styles.sectionTitle}>Métricas en Tiempo Real</Text>
        <View style={styles.apiGrid}>
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>KPI ACTUAL</Text>
            <Text style={[styles.gridVal, {color: '#2196F3'}]}>{eficiencia}%</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>TIPO DE CAMBIO</Text>
            <Text style={styles.gridVal}>${tipoCambio}</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>CLIMA</Text>
            <Text style={styles.gridVal}>{clima.temp}°C</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>HORA</Text>
            <Text style={styles.gridVal}>{horaServidor}</Text>
          </View>
        </View>

        {/* HISTORIAL */}
        <Text style={styles.sectionTitle}>Historial de Fixturas Finalizadas</Text>
        <View style={styles.historialContainer}>
          {historial.length === 0 ? (
            <View style={{padding: 20, alignItems: 'center'}}>
              <Text style={styles.noData}>No hay registros finalizados hoy</Text>
            </View>
          ) : (
            historial.map((item, index) => (
              <View key={index} style={styles.historialItem}>
                <View style={{flex: 1}}>
                  <Text style={styles.fixName}>{item.displayName}</Text>
                  {/* AQUÍ SE MUESTRAN LOS EMOJIS DE CALENDARIO Y TIEMPO */}
                  <Text style={styles.fixFecha}>
                    📅 {item.displayFecha} {item.tiempoTardado !== "N/A" && ` • ⏱️ ${item.tiempoTardado}`}
                  </Text>
                </View>
                <View style={styles.badge}><Text style={styles.badgeText}>LISTO</Text></View>
              </View>
            ))
          )}
        </View>

        {/* MANUAL PDF */}
        <TouchableOpacity style={styles.manualCard} onPress={abrirManualDrive}>
          <View style={styles.manualIcon}><Text style={{color: '#fff', fontWeight: 'bold'}}>PDF</Text></View>
          <View style={{flex: 1}}>
              <Text style={styles.manualTitle}>Manual de Procedimientos</Text>
              <Text style={styles.manualSub}>Toque para abrir el visor técnico</Text>
          </View>
        </TouchableOpacity>

        {/* Espacio final para que se pueda scrollear bien */}
        <View style={{height: 40}} /> 
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 20 : 45, paddingBottom: 15, elevation: 2 },
  topBarText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  logoutTopBtn: { backgroundColor: '#FFEBEE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  logoutTopText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 12 },
  
  container: { flex: 1, paddingHorizontal: 20 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: { backgroundColor: '#fff', padding: 25, borderRadius: 15, marginTop: 20, elevation: 3, borderLeftWidth: 8, borderLeftColor: '#2196F3' },
  label: { fontSize: 10, color: '#999', fontWeight: 'bold' },
  nameValue: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  rowInfo: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 15 },
  idValue: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  puestoValue: { fontSize: 13, color: '#2196F3', fontWeight: 'bold', textTransform: 'uppercase' },
  
  sectionTitle: { marginVertical: 15, fontSize: 14, fontWeight: 'bold', color: '#444' },
  
  apiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { backgroundColor: '#fff', width: '48%', padding: 15, borderRadius: 12, alignItems: 'center', elevation: 2, marginBottom: 15 },
  gridLabel: { fontSize: 9, color: '#888', fontWeight: 'bold', marginBottom: 5 },
  gridVal: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  
  historialContainer: { backgroundColor: '#fff', borderRadius: 15, padding: 5, elevation: 2 },
  historialItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  fixName: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  fixFecha: { fontSize: 11, color: '#777', marginTop: 2 },
  badge: { backgroundColor: '#E8F5E9', padding: 5, borderRadius: 5 },
  badgeText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 9 },
  noData: { textAlign: 'center', color: '#bbb', fontSize: 12 },
  
  manualCard: { backgroundColor: '#fff', marginTop: 10, padding: 20, borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  manualIcon: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  manualTitle: { fontSize: 16, fontWeight: 'bold' },
  manualSub: { fontSize: 12, color: '#999' }
});