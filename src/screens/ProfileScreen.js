import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';

// Importaciones de Firebase
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [horaServidor, setHoraServidor] = useState(null);
  const [eficiencia, setEficiencia] = useState(0);
  const [loading, setLoading] = useState(true);

  // META DIARIA: Puedes ajustarla según lo que pida el proyecto (ej. 10 fixturas al día)
  const META_DIARIA = 10;

  useEffect(() => {
    let unsubscribeKPI;

    const fetchIndustrialData = async () => {
      try {
        // 1. OBTENER DATOS DEL TÉCNICO (Carga inicial)
        const userAuth = auth.currentUser;
        if (userAuth) {
          const idUsuario = userAuth.email.split('@')[0].toUpperCase();
          const docSnap = await getDoc(doc(db, "usuarios", idUsuario));
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }

          // 2. CONFIGURAR ESCUCHA EN TIEMPO REAL PARA EL KPI
          // Buscamos registros donde el usuario es el actual y el estado es 'finalizado'
          const q = query(
            collection(db, "registros_escaneo"),
            where("usuarioId", "==", idUsuario),
            where("estado", "==", "finalizado")
          );

          unsubscribeKPI = onSnapshot(q, (querySnapshot) => {
            const totalCompletados = querySnapshot.size;
            // Cálculo de eficiencia: (Realizado / Meta) * 100
            let calculo = (totalCompletados / META_DIARIA) * 100;
            if (calculo > 100) calculo = 100; // Tope al 100%
            
            setEficiencia(calculo.toFixed(0)); // Sin decimales
          });
        }

        // 3. API DE TIEMPO (Hora oficial de la planta)
        const timeRes = await fetch('https://worldtimeapi.org/api/timezone/America/Chihuahua');
        const timeData = await timeRes.json();
        const horaResumen = new Date(timeData.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setHoraServidor(horaResumen);

      } catch (e) {
        console.log("Error en carga técnica:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchIndustrialData();

    // Limpieza al desmontar el componente
    return () => {
      if (unsubscribeKPI) unsubscribeKPI();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{marginTop: 10, color: '#666'}}>Sincronizando con Servidores...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* SECCIÓN DE IDENTIDAD INDUSTRIAL */}
      <View style={styles.headerCard}>
        <Text style={styles.label}>TÉCNICO RESPONSABLE</Text>
        <Text style={styles.nameValue}>{userData?.nombre || "Cargando..."}</Text>
        
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

      <Text style={styles.sectionTitle}>Panel de Control Operativo</Text>
      
      {/* TARJETAS DE APIS INDUSTRIALES */}
      <View style={styles.apiRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>HORA SERVIDOR</Text>
          <Text style={styles.val}>{horaServidor}</Text>
          <Text style={styles.cardDesc}>Ciudad Juárez (GMT-6)</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>EFICIENCIA KPI</Text>
          <Text style={[styles.val, {color: eficiencia >= 90 ? '#4CAF50' : '#FF9800'}]}>
            {eficiencia}%
          </Text>
          <Text style={styles.cardDesc}>Meta: 90%</Text>
        </View>
      </View>

      {/* BOTÓN DE MANUALES */}
      <TouchableOpacity 
        style={styles.manualCard}
        onPress={() => Alert.alert("ProjectCompany", "Accediendo a la base de datos de manuales técnicos...")}
      >
        <View style={styles.manualIcon}>
            <Text style={{color: '#fff', fontWeight: 'bold'}}>PDF</Text>
        </View>
        <View>
            <Text style={styles.manualTitle}>Manuales Técnicos</Text>
            <Text style={styles.manualSub}>Esquemas de fixturas y sensores</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.logoutBtn} 
        onPress={() => {
          auth.signOut();
          navigation.replace('Login');
        }}
      >
        <Text style={styles.logoutText}>CERRAR SESIÓN SEGURA</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 20 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: { 
    backgroundColor: '#fff', 
    padding: 25, 
    borderRadius: 15, 
    marginTop: 30, 
    elevation: 4,
    borderLeftWidth: 8,
    borderLeftColor: '#2196F3'
  },
  label: { fontSize: 10, color: '#999', fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
  nameValue: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  rowInfo: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 15 },
  idValue: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  puestoValue: { fontSize: 14, color: '#2196F3', fontWeight: 'bold', textTransform: 'uppercase' },
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
  logoutText: { color: 'white', fontWeight: 'bold' }
});