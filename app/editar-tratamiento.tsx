import { router, useLocalSearchParams } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import GradientButton from '../components/ui/custom/GradientButton';
import { PresupuestoContext } from '../src/context/PresupuestoContext';

export default function Editar() {

  const { id } = useLocalSearchParams();
  const { tratamientos, setTratamientos } = useContext(PresupuestoContext);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');

  useEffect(() => {
    const t = tratamientos.find((t: any) => t.id === id);
    if (t) {
      setNombre(t.nombre || '');
      setDescripcion(t.descripcion || '');
      setPrecio(t.precio ? t.precio.toString() : '');
    }
  }, [id]);

  const guardar = () => {
    const nuevos = tratamientos.map((t: any) =>
      t.id === id
        ? { ...t, nombre, descripcion, precio: Number(precio) }
        : t
    );

    setTratamientos(nuevos);
    Alert.alert('Éxito', 'Tratamiento guardado correctamente');
    router.replace('/tratamientos');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >

        {/* TÍTULO */}
        <Text style={styles.title}>Editar Tratamiento</Text>

        {/* NOMBRE */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            placeholder="Ej: Ortodoncia"
            value={nombre}
            onChangeText={setNombre}
            style={styles.input}
          />
        </View>

        {/* DESCRIPCIÓN */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            placeholder="Detalles del tratamiento"
            value={descripcion}
            onChangeText={setDescripcion}
            style={styles.input}
          />
        </View>

        {/* PRECIO */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Precio</Text>
          <TextInput
            placeholder="Ej: 500"
            value={precio}
            onChangeText={setPrecio}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        {/* BOTÓN */}
        <View style={{ marginTop: 30 }}>
          <GradientButton
            title="Guardar"
            onPress={guardar}
          />
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 80, // 🔥 controla qué tan abajo aparece todo
    backgroundColor: '#F8FAFC',
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
    color: '#020617',
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    fontSize: 16,

    // sombra iOS
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },

    // sombra Android
    elevation: 2,
  },
});