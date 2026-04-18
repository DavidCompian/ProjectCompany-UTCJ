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
  Dimensions,
  KeyboardAvoidingView 
} from 'react-native';

// Importaciones de Firebase
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebaseConfig'; 

// Importación del logo
import LogoImg from '../../assets/logo.png';

export default function LoginScreen({ navigation }) {
  const [numeroReloj, setNumeroReloj] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const irARegistro = () => {
    // RESTRICCIÓN: Solo permite si es PC (Web y pantalla ancha)
    const width = Dimensions.get('window').width;
    const esPC = Platform.OS === 'web' && width >= 768;

    if (esPC) {
      // Navega a la pantalla administrativa
      navigation.navigate('AdminRegister');
    } else {
      Alert.alert(
        "Acceso Denegado", 
        "El registro de personal y gestión de manuales solo se permite desde el panel administrativo en PC."
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

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, emailCorp, password);
      const docSnap = await getDoc(doc(db, "usuarios", idUsuario));

      if (docSnap.exists()) {
        navigation.replace('MainApp', { user: docSnap.data() });
      } else {
        // Fallback en caso de que no existan datos adicionales en Firestore
        navigation.replace('MainApp', { 
          user: { nombre: "Técnico", numeroReloj: idUsuario, puesto: "Operador" } 
        });
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Número de reloj o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.mainContainer}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="always" 
      >
        <View style={styles.card}>
          
          {/* LOGO CON RUTA SECRETA (3 segundos presionado) */}
          <TouchableOpacity 
            onLongPress={irARegistro} 
            delayLongPress={3000} 
            activeOpacity={0.8}
          >
            <Image 
              source={LogoImg} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          <View style={styles.form}>
            <TextInput 
              style={styles.input} 
              placeholder="Número de Reloj" 
              value={numeroReloj}
              onChangeText={setNumeroReloj} 
              autoCapitalize="characters" 
              placeholderTextColor="#999"
              cursorColor="#2196F3"
            />
            <TextInput 
              style={styles.input} 
              placeholder="Contraseña" 
              value={password}
              onChangeText={setPassword} 
              secureTextEntry 
              placeholderTextColor="#999"
              cursorColor="#2196F3"
            />
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin} 
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.buttonText}>CARGANDO...</Text>
              ) : (
                <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Indicador visual de modo administrativo para el navegador */}
          {Platform.OS === 'web' && Dimensions.get('window').width >= 768 && (
            <Text style={styles.hint}>Modo Administrativo Detectado</Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  card: { width: '90%', maxWidth: 450, alignItems: 'center', padding: 20 },
  logo: { width: 280, height: 200, marginBottom: 20 },
  form: { width: '100%' },
  input: { 
    backgroundColor: '#f5f5f5', 
    padding: 18, 
    borderRadius: 12, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#eee', 
    textAlign: 'center', 
    fontSize: 16, 
    color: '#000',
    ...Platform.select({ web: { outlineStyle: 'none' } }) 
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