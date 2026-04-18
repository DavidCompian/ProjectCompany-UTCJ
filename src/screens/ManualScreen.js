import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function ManualScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [contenido, setContenido] = useState('');

  useEffect(() => {
    const obtenerManual = async () => {
      const docSnap = await getDoc(doc(db, "configuracion", "manual_texto"));
      if (docSnap.exists()) setContenido(docSnap.data().contenido);
      setLoading(false);
    };
    obtenerManual();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2196F3"/></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MANUAL TÉCNICO</Text>
      </View>

      <ScrollView style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.manualText}>{contenido || "No hay instrucciones."}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#2196F3', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 20 },
  body: { flex: 1, padding: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 3 },
  manualText: { fontSize: 16, color: '#444', lineHeight: 26 }
});