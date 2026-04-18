import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Alert, Linking } from 'react-native';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import * as Location from 'expo-location';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [horaServidor, setHoraServidor] = useState('--:--');
  const [clima, setClima] = useState({ temp: '--', desc: 'Sincronizando...' });
  const [tipoCambio, setTipoCambio] = useState('--.--');
  const [eficiencia, setEficiencia] = useState(0);
  const [loading, setLoading] = useState(true);

  // URL de tu PDF en Google Drive (Asegúrate de que esté en "Cualquier persona con el enlace")
  const DRIVE_PDF_URL = "TU_ENLACE_DE_COMPARTIR_AQUÍ";

  const META_DIARIA = 10;

  useEffect(() => {
    let unsubscribeKPI;

    const inicializarApp = async () => {
      try {
        // Solicitud de permisos para clima
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

          const q = query(collection(db, "registros_escaneo"), where("usuarioId", "==", idUsuario), where("estado", "==", "finalizado"));
          unsubscribeKPI = onSnapshot(q, (snap) => {
            let calculo = (snap.size / META_DIARIA) * 100;
            setEficiencia(calculo > 100 ? 100 : calculo.toFixed(0));
          });
        }

        fetchHora();
        fetchDolar();
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
        .catch(() => setClima({ temp: 'N/A', desc: 'Desconectado' }));
    };

    const fetchDolar = () => {
      fetch('https://api.exchangerate-api.com/v4/latest/USD')
        .then(res => res.json())
        .then(data => setTipoCambio(data.rates.MXN.toFixed(2)))
        .catch(() => setTipoCambio('18.20'));
    };

    inicializarApp();
    return () => unsubscribeKPI && unsubscribeKPI();
  }, []);

  const abrirManualDrive = () => {
    Linking.openURL(DRIVE_PDF_URL).catch(() => {
      Alert.alert("Error", "No se pudo abrir el manual desde Google Drive.");
    });
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#2196F3"/></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.label}>TÉCNICO OPERATIVO</Text>
        <Text style={styles.nameValue}>{userData?.nombre || "Cargando..."}</Text>
        <View style={styles.rowInfo}>
          <View>
            <Text style={styles.label}>ID EMPLEADO</Text>
            <Text style={styles.idValue}>{userData?.numeroReloj || "S/N"}</Text>
          </View>
          <View style={{alignItems: 'flex-end'}}>
            <Text style={styles.label}>PUESTO</Text>
            <Text style={styles.puestoValue}>{userData?.puesto || "Técnico"}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Panel de Control</Text>
      
      <View style={styles.apiRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>HORA OFICIAL</Text>
          <Text style={styles.val}>{horaServidor}</Text>
          <Text style={styles.cardDesc}>Juárez</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>CLIMA</Text>
          <Text style={styles.val}>{clima.temp}°C</Text>
          <Text style={[styles.cardDesc, {textTransform: 'capitalize'}]}>{clima.desc}</Text>
        </View>
      </View>

      <View style={[styles.apiRow, {marginTop: 15}]}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DÓLAR (MXN)</Text>
          <Text style={styles.val}>${tipoCambio}</Text>
          <Text style={styles.cardDesc}>Finanzas</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>KPI EFICIENCIA</Text>
          <Text style={[styles.val, {color: eficiencia >= 90 ? '#4CAF50' : '#FF9800'}]}>{eficiencia}%</Text>
          <Text style={styles.cardDesc}>Firebase</Text>
        </View>
      </View>

      {/* BOTÓN DE MANUAL CONECTADO A GOOGLE DRIVE */}
      <TouchableOpacity style={styles.manualCard} onPress={abrirManualDrive}>
        <View style={styles.manualIcon}><Text style={{color: '#fff', fontWeight: 'bold'}}>PDF</Text></View>
        <View style={{flex: 1}}>
            <Text style={styles.manualTitle}>Manual de Procedimientos</Text>
            <Text style={styles.manualSub}>Abrir archivo desde Google Drive</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => { auth.signOut(); navigation.replace('Login'); }}>
        <Text style={{color: '#fff', fontWeight: 'bold'}}>CERRAR SESIÓN</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 20 },
  loading: { flex: 1, justifyContent: 'center' },
  headerCard: { backgroundColor: '#fff', padding: 25, borderRadius: 15, marginTop: 30, elevation: 4, borderLeftWidth: 8, borderLeftColor: '#2196F3' },
  label: { fontSize: 10, color: '#999', fontWeight: 'bold' },
  nameValue: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  rowInfo: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  idValue: { fontSize: 16, fontWeight: 'bold' },
  puestoValue: { fontSize: 13, color: '#2196F3', fontWeight: 'bold' },
  sectionTitle: { marginVertical: 20, fontSize: 14, fontWeight: 'bold', color: '#666' },
  apiRow: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, width: '48%', alignItems: 'center', elevation: 2 },
  cardLabel: { fontSize: 10, color: '#888', fontWeight: 'bold' },
  val: { fontSize: 24, fontWeight: 'bold', color: '#2196F3' },
  cardDesc: { fontSize: 9, color: '#bbb' },
  manualCard: { backgroundColor: '#fff', marginTop: 20, padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  manualIcon: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  manualTitle: { fontSize: 16, fontWeight: 'bold' },
  manualSub: { fontSize: 12, color: '#999' },
  logoutBtn: { backgroundColor: '#333', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30, marginBottom: 50 }
});