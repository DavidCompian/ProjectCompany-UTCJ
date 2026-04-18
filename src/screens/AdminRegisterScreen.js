import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons'; // Para un icono de volver

export default function AdminRegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [numeroReloj, setNumeroReloj] = useState('');
  const [puesto, setPuesto] = useState('');
  const [password, setPassword] = useState('');
  const [urlManual, setUrlManual] = useState('');
  const [uploading, setUploading] = useState(false);
  const [linkSaving, setLinkSaving] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Alert.alert("Acceso Prohibido", "Esta función es exclusiva para PC.");
      navigation.goBack();
    }
  }, []);

  const registrarPersonal = async () => {
    const idLimpio = numeroReloj.trim().toUpperCase();
    const emailFinal = `${idLimpio}@projectcompany.com`.replace(/\s/g, '');
    
    if (!nombre || !idLimpio || !password) {
      Alert.alert("Error", "Todos los campos son obligatorios.");
      return;
    }

    setUploading(true);
    try {
      await createUserWithEmailAndPassword(auth, emailFinal, password.trim());
      await setDoc(doc(db, "usuarios", idLimpio), {
        nombre: nombre.trim(),
        numeroReloj: idLimpio,
        puesto: puesto.trim(),
        rol: 'operador',
        fechaRegistro: new Date().toISOString()
      });
      Alert.alert("Éxito", "Usuario registrado correctamente.");
      setNombre(''); setNumeroReloj(''); setPuesto(''); setPassword('');
    } catch (error) {
      Alert.alert("Error", "No se pudo completar el registro.");
    } finally {
      setUploading(false);
    }
  };

  const guardarLinkManual = async () => {
    if (!urlManual.includes('http')) {
      Alert.alert("Error", "Pega un enlace válido de Google Drive.");
      return;
    }
    setLinkSaving(true);
    try {
      await setDoc(doc(db, "configuracion", "manual"), {
        url: urlManual.trim(),
        ultimaActualizacion: new Date().toISOString()
      }, { merge: true });
      Alert.alert("Éxito", "Enlace actualizado.");
      setUrlManual('');
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar.");
    } finally {
      setLinkSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* BOTÓN PARA SALIR / VOLVER AL LOGIN */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.navigate('Login')}
      >
        <Ionicons name="arrow-back" size={24} color="#333" />
        <Text style={styles.backText}>Volver al Inicio</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Panel Administrativo V2</Text>
      
      <View style={styles.section}>
        <Text style={styles.subtitle}>Alta de Personal</Text>
        <TextInput style={styles.input} placeholder="Nombre del Técnico" value={nombre} onChangeText={setNombre} />
        <TextInput style={styles.input} placeholder="No. Reloj" value={numeroReloj} onChangeText={setNumeroReloj} autoCapitalize="characters" />
        <TextInput style={styles.input} placeholder="Puesto" value={puesto} onChangeText={setPuesto} />
        <TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={registrarPersonal} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>REGISTRAR TÉCNICO</Text>}
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { marginTop: 30, paddingBottom: 50 }]}>
        <Text style={[styles.subtitle, { color: '#2196F3' }]}>Enlace Manual Técnico</Text>
        <TextInput style={styles.input} placeholder="Link de Google Drive" value={urlManual} onChangeText={setUrlManual} />
        <TouchableOpacity style={[styles.button, { backgroundColor: '#2196F3' }]} onPress={guardarLinkManual} disabled={linkSaving}>
          {linkSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>ACTUALIZAR ENLACE</Text>}
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
  section: { width: '100%', maxWidth: 500, alignSelf: 'center', marginTop: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, marginTop: 40 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#4caf50', marginBottom: 20, fontWeight: 'bold', textTransform: 'uppercase' },
  input: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  button: { backgroundColor: '#4caf50', padding: 20, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});