import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Image, 
  ScrollView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard, 
  Dimensions,
  KeyboardAvoidingView 
} from 'react-native';

// Importaciones de Firebase
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebaseConfig'; 

export default function LoginScreen({ navigation }) {
  const [numeroReloj, setNumeroReloj] = useState('');
  const [password, setPassword] = useState('');

  const irARegistro = () => {
    // REGLA DE SEGURIDAD: Solo permite si es WEB y la pantalla es de PC (> 768px)
    // Si es un celular (aunque use navegador web), el ancho será menor a 768
    const esPC = Platform.OS === 'web' && Dimensions.get('window').width >= 768;

    if (esPC) {
      navigation.navigate('AdminRegister');
    } else {
      Alert.alert(
        "Acceso Denegado", 
        "El registro de personal solo se puede realizar desde el panel administrativo en una PC de escritorio."
      );
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* LOGO CON RUTA SECRETA: 3 segundos presionado */}
            <TouchableOpacity onLongPress={irARegistro} delayLongPress={3000}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
            </TouchableOpacity>
            
            <View style={styles.form}>
              <TextInput 
                style={styles.input} 
                placeholder="Número de Reloj" 
                value={numeroReloj}
                onChangeText={text => setNumeroReloj(text)} 
                autoCapitalize="characters" 
                placeholderTextColor="#999"
              />
              <TextInput 
                style={styles.input} 
                placeholder="Contraseña" 
                value={password}
                onChangeText={text => setPassword(text)} 
                secureTextEntry 
                placeholderTextColor="#999"
              />
              
              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
              </TouchableOpacity>
            </View>

            {/* Hint solo visible en PC para no dar pistas en móvil */}
            {Platform.OS === 'web' && Dimensions.get('window').width >= 768 && (
              <Text style={styles.hint}>PC Detectada: Mantén presionado el logo para gestionar personal</Text>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingVertical: 20
  },
  card: {
    width: '90%',
    maxWidth: 450,
    alignItems: 'center',
    padding: 20
  },
  logo: { 
    width: 280, 
    height: 200, 
    marginBottom: 20 
  },
  form: {
    width: '100%',
  },
  input: { 
    backgroundColor: '#f5f5f5', 
    padding: 18, 
    borderRadius: 12, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#eee', 
    textAlign: 'center',
    fontSize: 16,
    color: '#000'
  },
  button: { 
    backgroundColor: '#2196F3', 
    padding: 20, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  hint: { textAlign: 'center', marginTop: 25, color: '#ccc', fontSize: 11 }
});