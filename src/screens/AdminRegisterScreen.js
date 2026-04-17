import React, { useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function AdminRegisterScreen({ navigation }) {
  const [nombre, setNombre] = React.useState('');
  const [numeroReloj, setNumeroReloj] = React.useState('');
  const [puesto, setPuesto] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [uploading, setUploading] = React.useState(false);

  // Bloqueo de seguridad: Si no es WEB, lo sacamos de aquí
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
      Alert.alert("Éxito", "Usuario registrado desde Panel Web.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "No se pudo completar el registro.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Panel Administrativo</Text>
      <Text style={styles.subtitle}>Alta de Personal (Solo Web)</Text>
      
      <TextInput style={styles.input} placeholder="Nombre del Técnico" onChangeText={setNombre} />
      <TextInput style={styles.input} placeholder="No. Reloj" onChangeText={setNumeroReloj} autoCapitalize="characters" />
      <TextInput style={styles.input} placeholder="Puesto" onChangeText={setPuesto} />
      <TextInput style={styles.input} placeholder="Contraseña" onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity 
        style={[styles.button, uploading && { backgroundColor: '#ccc' }]} 
        onPress={registrarPersonal}
        disabled={uploading}
      >
        {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>REGISTRAR TÉCNICO</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 40, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#4caf50', marginBottom: 30, fontWeight: 'bold' },
  input: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  button: { backgroundColor: '#4caf50', padding: 20, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});