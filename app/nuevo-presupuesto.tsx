import { router } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import GradientButton from '../components/ui/custom/GradientButton';
import { PresupuestoContext } from '../src/context/PresupuestoContext';

export default function NuevoPresupuesto() {
  const { paciente, setPaciente, resetPresupuesto } =
    useContext(PresupuestoContext);

  const [focusedInput, setFocusedInput] = useState('');

  // IMPORTANTE: useRef para evitar recrear animación
  const animatedBorder = useRef(new Animated.Value(0)).current;

  // Limpia todo al entrar (nuevo paciente)
  useEffect(() => {
    resetPresupuesto();
  }, []);

  const animateFocus = (toValue: number) => {
    Animated.timing(animatedBorder, {
      toValue,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = animatedBorder.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', '#3B82F6'],
  });

  const continuar = () => {
    if (!paciente.nombre || !paciente.edad) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    Alert.alert('Correcto', 'Datos guardados');
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
        {/* HEADER */}
        <Text style={styles.title}>Nuevo Presupuesto</Text>

        {/* NOMBRE */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre del paciente</Text>

          <Animated.View style={[styles.inputWrapper, { borderColor }]}>
            <TextInput
              style={styles.input}
              placeholder="Ej: Juan Pérez"
              value={paciente.nombre}
              onFocus={() => {
                setFocusedInput('nombre');
                animateFocus(1);
              }}
              onBlur={() => {
                setFocusedInput('');
                animateFocus(0);
              }}
              onChangeText={(text) =>
                setPaciente({ ...paciente, nombre: text })
              }
            />
          </Animated.View>
        </View>

        {/* EDAD */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Edad</Text>

          <Animated.View style={[styles.inputWrapper, { borderColor }]}>
            <TextInput
              style={styles.input}
              placeholder="Ej: 25"
              keyboardType="numeric"
              value={paciente.edad}
              onFocus={() => {
                setFocusedInput('edad');
                animateFocus(1);
              }}
              onBlur={() => {
                setFocusedInput('');
                animateFocus(0);
              }}
              onChangeText={(text) =>
                setPaciente({ ...paciente, edad: text })
              }
            />
          </Animated.View>
        </View>

        {/* BOTÓN */}
        <View style={{ marginTop: 30 }}>
          <GradientButton
            title="Continuar"
            onPress={continuar}
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
    justifyContent: 'center',
    backgroundColor: '#F8FAFC'
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
    color: '#020617'
  },

  inputGroup: {
    marginBottom: 20
  },

  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 6
  },

  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',

    // sombra iOS
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },

    // sombra Android
    elevation: 2
  },

  input: {
    padding: 16,
    fontSize: 16,
  }
});