import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView 
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons'; 

export default function AdminRegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [numeroReloj, setNumeroReloj] = useState('');
  const [puesto, setPuesto] = useState('');
  const [passUser, setPassUser] = useState('');
  const [nuevoManual, setNuevoManual] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. REGISTRO DE TÉCNICO
  const registrarUsuario = async () => {
    if (!nombre || !numeroReloj || !puesto || !passUser) {
      alert("Por favor llena todos los campos."); // Usamos alert directo para asegurar visibilidad en Web
      return;
    }

    setLoading(true);
    try {
      const email = `${numeroReloj.toLowerCase().trim()}@projectcompany.com`;
      
      // Crear en Auth
      await createUserWithEmailAndPassword(auth, email, passUser);
      
      // Guardar en Firestore (Usamos setDoc para que cree el documento si no existe)
      await setDoc(doc(db, "usuarios", numeroReloj.toUpperCase().trim()), {
        nombre: nombre.trim(),
        numeroReloj: numeroReloj.toUpperCase().trim(),
        puesto: puesto.trim(),
        rol: 'tecnico',
        fechaRegistro: new Date().toISOString()
      });

      // CONFIRMACIÓN
      Alert.alert("Éxito", `Técnico ${nombre} registrado correctamente.`);
      if(Platform.OS === 'web') alert(`¡Éxito! Técnico ${nombre} registrado.`);

      setNombre(''); setNumeroReloj(''); setPuesto(''); setPassUser('');
      
    } catch (e) {
      console.error(e);
      alert("Error al registrar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. ACTUALIZAR MANUAL (Usando setDoc con merge para asegurar guardado)
  const actualizarManual = async () => {
    if (!nuevoManual.includes('drive.google.com')) {
      alert("El link debe ser de Google Drive.");
      return;
    }

    setLoading(true);
    try {
      const docRef = doc(db, "configuracion", "manual");
      // setDoc con merge:true crea el documento si no existe o lo actualiza si ya está
      await setDoc(docRef, { url: nuevoManual.trim() }, { merge: true });

      Alert.alert("Manual Actualizado", "El link se guardó correctamente.");
      if(Platform.OS === 'web') alert("¡Manual Actualizado con éxito!");
      
      setNuevoManual('');
    } catch (e) {
      console.error(e);
      alert("Error al guardar en base de datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      
      {/* BARRA SUPERIOR CON FLECHA A LA IZQUIERDA */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#2196F3" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.titleApp}>PROJECTCOMPANY</Text>
          <Text style={styles.subtitleApp}>Panel Administrativo</Text>
        </View>
        <View style={{width: 40}} /> 
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scroll}>
          
          <View style={styles.card}>
            <Text style={styles.cardHeader}>ALTA DE PERSONAL</Text>
            <View style={styles.line} />

            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Nombre completo" />

            <View style={styles.row}>
                <View style={{width: '48%'}}>
                    <Text style={styles.label}>N° Reloj</Text>
                    <TextInput style={styles.input} value={numeroReloj} onChangeText={setNumeroReloj} autoCapitalize="characters" placeholder="ID" />
                </View>
                <View style={{width: '48%'}}>
                    <Text style={styles.label}>Contraseña</Text>
                    <TextInput style={styles.input} value={passUser} onChangeText={setPassUser} secureTextEntry placeholder="******" />
                </View>
            </View>

            <Text style={styles.label}>Puesto</Text>
            <TextInput style={styles.input} value={puesto} onChangeText={setPuesto} placeholder="Puesto técnico" />

            <TouchableOpacity style={styles.btnGreen} onPress={registrarUsuario} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnText}>REGISTRAR TÉCNICO</Text>}
            </TouchableOpacity>
          </View>

          <View style={[styles.card, {marginTop: 25}]}>
            <Text style={styles.cardHeader}>MANUAL TÉCNICO</Text>
            <View style={[styles.line, {backgroundColor: '#2196F3'}]} />
            
            <Text style={styles.label}>Link de Google Drive</Text>
            <TextInput style={styles.input} value={nuevoManual} onChangeText={setNuevoManual} placeholder="Pegar URL aquí" />

            <TouchableOpacity style={[styles.btnGreen, {backgroundColor: '#2196F3'}]} onPress={actualizarManual} disabled={loading}>
              <Text style={styles.btnText}>ACTUALIZAR LINK</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f0f2f5' },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingTop: Platform.OS === 'web' ? 20 : 50, paddingBottom: 20, paddingHorizontal: 20, elevation: 4 },
  backBtn: { padding: 8, backgroundColor: '#e3f2fd', borderRadius: 10 },
  headerTitles: { alignItems: 'center' },
  titleApp: { fontSize: 20, fontWeight: 'bold', color: '#2196F3', letterSpacing: 1 },
  subtitleApp: { fontSize: 10, color: '#999', fontWeight: 'bold' },
  scroll: { padding: 25, alignItems: 'center' },
  card: { backgroundColor: '#fff', width: '100%', maxWidth: 600, padding: 25, borderRadius: 20, elevation: 3 },
  cardHeader: { fontSize: 14, fontWeight: 'bold', color: '#444' },
  line: { height: 4, width: 30, backgroundColor: '#4CAF50', marginVertical: 10, borderRadius: 2 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#999', marginBottom: 5 },
  input: { backgroundColor: '#f9f9f9', padding: 14, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  btnGreen: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 }
});