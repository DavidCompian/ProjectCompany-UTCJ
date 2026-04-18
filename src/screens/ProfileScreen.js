import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Modal } from 'react-native';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [horaServidor, setHoraServidor] = useState(null);
  const [eficiencia, setEficiencia] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Estados para el Manual Interno
  const [manualVisible, setManualVisible] = useState(false);
  const [contenidoManual, setContenidoManual] = useState('Cargando instrucciones...');

  const META_DIARIA = 10;

  useEffect(() => {
    let unsubscribeKPI;

    const fetchIndustrialData = async () => {
      try {
        const userAuth = auth.currentUser;
        if (userAuth) {
          const idUsuario = userAuth.email.split('@')[0].toUpperCase();
          const docSnap = await getDoc(doc(db, "usuarios", idUsuario));
          if (docSnap.exists()) setUserData(docSnap.data());

          const q = query(
            collection(db, "registros_escaneo"),
            where("usuarioId", "==", idUsuario),
            where("estado", "==", "finalizado")
          );

          unsubscribeKPI = onSnapshot(q, (querySnapshot) => {
            const total = querySnapshot.size;
            let calculo = (total / META_DIARIA) * 100;
            setEficiencia(calculo > 100 ? 100 : calculo.toFixed(0));
          });
        }

        const timeRes = await fetch('https://worldtimeapi.org/api/timezone/America/Chihuahua');
        const timeData = await timeRes.json();
        setHoraServidor(new Date(timeData.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      } catch (e) {
        console.log("Error V2:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchIndustrialData();
    return () => unsubscribeKPI && unsubscribeKPI();
  }, []);

  const abrirManualInterno = async () => {
    setManualVisible(true);
    try {
      const docSnap = await getDoc(doc(db, "configuracion", "manual_texto"));
      if (docSnap.exists()) {
        setContenidoManual(docSnap.data().contenido);
      } else {
        setContenidoManual("No hay instrucciones cargadas por el administrador.");
      }
    } catch (e) {
      setContenidoManual("Error al conectar con la base de datos de manuales.");
    }
  };

  if (loading) return <View style={styles.loadingCenter}><ActivityIndicator size="large" color="#2196F3" /></View>;

  return (
    <ScrollView style={styles.container}>
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
            <Text style={styles.puestoValue}>{userData?.puesto || "Mantenimiento"}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Panel Operativo</Text>
      
      <View style={styles.apiRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>HORA SERVIDOR</Text>
          <Text style={styles.val}>{horaServidor}</Text>
          <Text style={styles.cardDesc}>Juárez (GMT-6)</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>EFICIENCIA KPI</Text>
          <Text style={[styles.val, {color: eficiencia >= 90 ? '#4CAF50' : '#FF9800'}]}>{eficiencia}%</Text>
          <Text style={styles.cardDesc}>Meta: 90%</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.manualCard} onPress={abrirManualInterno}>
        <View style={styles.manualIcon}><Text style={{color: '#fff', fontWeight: 'bold'}}>DOC</Text></View>
        <View style={{flex: 1}}>
            <Text style={styles.manualTitle}>Manuales Técnicos</Text>
            <Text style={styles.manualSub}>Instrucciones de Fixturas y Sensores</Text>
        </View>
      </TouchableOpacity>

      {/* MODAL DEL MANUAL: FUNCIONA EN TODO MÓVIL Y WEB */}
      <Modal visible={manualVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContent}>
           <Text style={styles.modalHeader}>Manual Técnico</Text>
           <ScrollView style={styles.modalBody}>
              <Text style={styles.manualText}>{contenidoManual}</Text>
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
  label: { fontSize: 10, color: '#999', fontWeight: 'bold', marginBottom: 5 },
  nameValue: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  rowInfo: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 15 },
  idValue: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  puestoValue: { fontSize: 13, color: '#2196F3', fontWeight: 'bold', textTransform: 'uppercase' },
  sectionTitle: { marginVertical: 20, fontSize: 16, fontWeight: 'bold', color: '#444' },
  apiRow: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, width: '48%', alignItems: 'center', elevation: 2 },
  cardLabel: { fontSize: 10, color: '#888', fontWeight: 'bold', marginBottom: 8 },
  val: { fontSize: 24, fontWeight: 'bold', color: '#2196F3' },
  cardDesc: { fontSize: 9, color: '#bbb', marginTop: 5 },
  manualCard: { backgroundColor: '#fff', marginTop: 20, padding: 20, borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  manualIcon: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#FF5252', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  manualTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  manualSub: { fontSize: 12, color: '#999' },
  logoutBtn: { backgroundColor: '#333', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30, marginBottom: 50 },
  logoutText: { color: 'white', fontWeight: 'bold' },
  
  // Estilos del Modal
  modalContent: { flex: 1, backgroundColor: '#fff', padding: 30, paddingTop: 60 },
  modalHeader: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#2196F3' },
  modalBody: { flex: 1, backgroundColor: '#f9f9f9', borderRadius: 10, padding: 15 },
  manualText: { fontSize: 16, color: '#333', lineHeight: 24 },
  closeBtn: { backgroundColor: '#333', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  closeBtnText: { color: '#fff', fontWeight: 'bold' }
});