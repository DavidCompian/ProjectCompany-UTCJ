import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';

// Importaciones de Firebase
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebaseConfig'; 

export default function LoginScreen({ navigation }) {
  const [numeroReloj, setNumeroReloj] = useState('');
  const [password, setPassword] = useState('');

  const irARegistro = () => {
    // RESTRICCIÓN: Solo permite entrar al registro si detecta que estás en PC/Navegador
    if (Platform.OS === 'web') {
      navigation.navigate('AdminRegister');
    } else {
      Alert.alert("Acceso Denegado", "El registro de personal solo se puede realizar desde el panel administrativo en PC.");
    }
  };

  const handleLogin = async () => {
    const idUsuario = numeroReloj.trim().toUpperCase();
    const emailCorp = `${idUsuario}@projectcompany.com`.replace(/\s/g, '');

    if (!numeroReloj || !password) {
      Alert.alert("ProjectCompany", "Ingresa tus credenciales.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, emailCorp, password);
      const docSnap = await getDoc(doc(db, "usuarios", idUsuario));

      if (docSnap.exists()) {
        navigation.replace('MainApp', { user: docSnap.data() });
      } else {
        navigation.replace('MainApp', { 
          user: { nombre: "Técnico Nuevo", numeroReloj: idUsuario, puesto: "Operador" } 
        });
      }
    } catch (error) {
      Alert.alert("Error", "Número de reloj o contraseña incorrectos.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* TU LOGO ORIGINAL ESTÁ AQUÍ */}
        <TouchableOpacity onLongPress={irARegistro} delayLongPress={3000}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TextInput 
          style={styles.input} 
          placeholder="Número de Reloj" 
          onChangeText={setNombre => setNumeroReloj(setNombre)} 
          autoCapitalize="characters" 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Contraseña" 
          onChangeText={setPass => setPassword(setPass)} 
          secureTextEntry 
        />
        
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
        </TouchableOpacity>

        {Platform.OS === 'web' && (
          <Text style={styles.hint}>PC Detectada: Mantén presionado el logo para registrar</Text>
        )}
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
  logo: { width: 280, height: 280, alignSelf: 'center', marginBottom: 10 },
  brand: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#2196F3', marginBottom: 30, fontWeight: 'bold' },
  input: { backgroundColor: '#f5f5f5', padding: 18, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#eee', textAlign: 'center' },
  button: { backgroundColor: '#2196F3', padding: 20, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  hint: { textAlign: 'center', marginTop: 20, color: '#ccc', fontSize: 11 }
});