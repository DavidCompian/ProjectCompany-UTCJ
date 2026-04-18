import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function AdminRegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [numeroReloj, setNumeroReloj] = useState('');
  const [puesto, setPuesto] = useState('');
  const [password, setPassword] = useState('');
  const [textoManual, setTextoManual] = useState(''); // Ahora es texto, no link
  const [loading, setLoading] = useState(false);
  const [savingManual, setSavingManual] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Alert.alert("Acceso Prohibido", "Esta función es exclusiva para PC.");
      navigation.goBack();
    }

    // Cargar el texto actual que está en la base de datos para poder editarlo
    const cargarContenidoManual = async () => {
      try {
        const docSnap = await getDoc(doc(db, "configuracion", "manual_texto"));
        if (docSnap.exists()) {
          setTextoManual(docSnap.data().contenido);
        }
      } catch (e) {
        console.log("Error al cargar manual:", e);
      }
    };
    cargarContenidoManual();
  }, []);

  const registrarPersonal = async () => {
    const idLimpio = numeroReloj.trim().toUpperCase();
    const emailFinal = `${idLimpio}@projectcompany.com`.replace(/\s/g, '');
    
    if (!nombre || !idLimpio || !password) {
      Alert.alert("Error", "Todos los campos son obligatorios.");
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, emailFinal, password.trim());
      await setDoc(doc(db, "usuarios", idLimpio), {
        nombre: nombre.trim(),
        numeroReloj: idLimpio,
        puesto: puesto.trim(),
        rol: 'operador',
        fechaRegistro: new Date().toISOString()
      });
      Alert.alert("Éxito", "Técnico registrado correctamente.");
      setNombre(''); setNumeroReloj(''); setPuesto(''); setPassword('');
    } catch (error) {
      Alert.alert("Error", "No se pudo completar el registro.");
    } finally {
      setLoading(false);
    }
  };

  const guardarContenidoManual = async () => {
    if (textoManual.length < 10) {
      Alert.alert("Error", "El contenido del manual es muy corto.");
      return;
    }

    setSavingManual(true);
    try {
      // Guardamos el texto plano en Firestore. Esto es gratis y 100% compatible.
      await setDoc(doc(db, "configuracion", "manual_texto"), {
        contenido: textoManual,
        ultimaActualizacion: new Date().toISOString()
      }, { merge: true });
      
      Alert.alert("Éxito", "Contenido del manual actualizado para todos los técnicos.");
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar el contenido.");
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.navigate('Login')}
      >
        <Ionicons name="arrow-back" size={24} color="#333" />
        <Text style={styles.backText}>Volver al Inicio</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Panel Administrativo</Text>
      
      {/* SECCIÓN 1: REGISTRO DE USUARIOS */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Alta de Personal</Text>
        <TextInput style={styles.input} placeholder="Nombre del Técnico" value={nombre} onChangeText={setNombre} />
        <TextInput style={styles.input} placeholder="No. Reloj" value={numeroReloj} onChangeText={setNumeroReloj} autoCapitalize="characters" />
        <TextInput style={styles.input} placeholder="Puesto" value={puesto} onChangeText={setPuesto} />
        <TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={registrarPersonal} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>REGISTRAR TÉCNICO</Text>}
        </TouchableOpacity>
      </View>

      {/* SECCIÓN 2: MANUAL TÉCNICO (TEXTO) */}
      <View style={[styles.section, { marginTop: 30, paddingBottom: 50 }]}>
        <Text style={[styles.subtitle, { color: '#2196F3' }]}>Editor de Manual Técnico</Text>
        <Text style={styles.infoText}>Escriba las instrucciones, esquemas y guías de sensores aquí abajo:</Text>
        
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Ej: Paso 1: Verifique el sensor inductivo..." 
          value={textoManual} 
          onChangeText={setTextoManual}
          multiline={true}
          numberOfLines={10}
          textAlignVertical="top"
        />

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#2196F3' }]} 
          onPress={guardarContenidoManual} 
          disabled={savingManual}
        >
          {savingManual ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>ACTUALIZAR MANUAL EN LA APP</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 40, backgroundColor: '#fff' },
  backButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    position: 'absolute', 
    top: 20, 
    left: 20,
    zIndex: 10
  },
  backText: { marginLeft: 5, fontSize: 16, color: '#333', fontWeight: '500' },
  section: { width: '100%', maxWidth: 600, alignSelf: 'center', marginTop: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, marginTop: 40 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#4caf50', marginBottom: 20, fontWeight: 'bold', textTransform: 'uppercase' },
  input: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  textArea: { height: 200, fontSize: 14, lineHeight: 20 },
  button: { backgroundColor: '#4caf50', padding: 20, borderRadius: 10, alignItems: 'center', elevation: 2 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  infoText: { fontSize: 12, color: '#666', marginBottom: 10, textAlign: 'center' }
});