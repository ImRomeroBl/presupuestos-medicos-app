import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CLINICA } from '../src/config/clinic';
import { usePresupuesto } from '../src/context/PresupuestoContext';
import { calcularTotales } from '../src/domain/calculos';
import { validarPresupuesto, type ErrorValidacion } from '../src/domain/validaciones';
import { formatCurrency } from '../src/lib/currency';
import { buildPresupuestoHtml } from '../src/services/pdf/buildPresupuestoHtml';
import { generatePresupuestoPdf } from '../src/services/pdf/generatePresupuestoPdf';
import { getLogoDataUri } from '../src/services/pdf/getLogoDataUri';
import { sharePresupuestoPdf } from '../src/services/pdf/sharePresupuestoPdf';

const MENSAJES_ERROR: Record<ErrorValidacion, string> = {
  'paciente-incompleto': 'Faltan datos del paciente',
  'sin-tratamientos': 'Agrega al menos un tratamiento',
  'sin-tratamientos-validos': 'Agrega tratamientos válidos',
  'total-invalido': 'El total debe ser mayor a 0',
};

export default function Resumen() {

  const { paciente, tratamientos, guardarPresupuesto, resetPresupuesto } = usePresupuesto();
  const params = useLocalSearchParams();

  const yaListo = params.listo === 'true';
  const [pdfGenerado, setPdfGenerado] = useState(yaListo);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const generacionIniciada = useRef(false);

  const generarPDF = useCallback(async (): Promise<string | null> => {
    try {
      const error = validarPresupuesto(paciente, tratamientos);
      if (error) {
        Alert.alert('Error', MENSAJES_ERROR[error]);
        return null;
      }

      const { tratamientosValidos, total } = calcularTotales(tratamientos);
      const logoDataUri = await getLogoDataUri();

      const html = buildPresupuestoHtml({
        paciente,
        tratamientosValidos,
        total,
        clinica: CLINICA,
        logoDataUri,
        fecha: new Date(),
      });

      const { uri } = await generatePresupuestoPdf({
        html,
        patientName: paciente.nombre,
      });

      setPdfUri(uri);
      setPdfGenerado(true);

      return uri;
    } catch (error) {
      console.log('ERROR REAL PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF');
      return null;
    }
  }, [paciente, tratamientos]);

  const compartirPDF = async () => {
    try {
      const resultado = await sharePresupuestoPdf(pdfUri);

      if (resultado === 'missing-uri') {
        Alert.alert('Error', 'Primero genera el PDF');
        return;
      }

      if (resultado === 'not-found') {
        Alert.alert('Error', 'El archivo no existe');
        return;
      }
    } catch (error) {
      console.log('💥 ERROR SHARE:', error);
      Alert.alert('Error', 'No se pudo compartir');
    }
  };

  useEffect(() => {
    if (generacionIniciada.current) return;
    generacionIniciada.current = true;

    const generarYGuardar = async () => {
      const uri = await generarPDF();

      if (uri) {
        // La persistencia es una decisión de la pantalla, no del servicio PDF.
        guardarPresupuesto(uri);
      }
    };

    generarYGuardar();
  }, [generarPDF, guardarPresupuesto]);

  const { total } = calcularTotales(tratamientos);

return (
  <View style={styles.container}>

    {/* HEADER */}
    <Text style={styles.title}>Resumen</Text>

    {/* CARD */}
    <View style={styles.card}>
      <Text style={styles.label}>Paciente</Text>
      <Text style={styles.value}>
        {paciente.nombre} - {paciente.edad} años
      </Text>

      <View style={{ height: 10 }} />

      <Text style={styles.label}>Total</Text>
      <Text style={styles.total}>
        ${formatCurrency(total)}
      </Text>
    </View>

    {/* BOTONES */}
    <View style={styles.buttons}>

      {/* 🔵 PRINCIPAL (MISMA FUNCIÓN) */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={compartirPDF}
      >
        <Text style={styles.buttonText}>Compartir PDF</Text>
      </TouchableOpacity>

      {/* 🔘 RESTO IGUAL */}
      {pdfGenerado && (
        <>
          <View style={{ height: 10 }} />

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace('/tratamientos')}
          >
            <Text style={styles.buttonText}>Editar tratamientos</Text>
          </TouchableOpacity>

          <View style={{ height: 10 }} />

          <TouchableOpacity
            style={styles.darkButton}
            onPress={() => {
              resetPresupuesto();
              router.dismissAll();
              router.replace('/');
            }}
          >
            <Text style={styles.buttonText}>Ir al inicio</Text>
          </TouchableOpacity>
        </>
      )}

    </View>

  </View>
);
}
const styles = StyleSheet.create({

  container: {
  flex: 1,
  padding: 20,
  paddingTop: 80, // aquí controlas cuánto baja
  },

  primaryButton: {
  backgroundColor: '#2563eb',
  padding: 18,
  borderRadius: 12,
  marginBottom: 15,
  shadowColor: '#2563eb',
  shadowOpacity: 0.6,
  shadowRadius: 10,
  elevation: 5
},

  secondaryButton: {
    backgroundColor: '#6b7280',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10
  },

  darkButton: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 12
  },

  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16
  },
  title: {
  fontSize: 22,
  fontWeight: '700',
  marginBottom: 20,
  textAlign: 'center',
  color: '#020617',
},

card: {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 18,
  marginBottom: 25,

  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,
},

label: {
  fontSize: 13,
  color: '#64748B',
},

value: {
  fontSize: 16,
  fontWeight: '600',
  color: '#020617',
},

total: {
  fontSize: 24,
  fontWeight: '800',
  color: '#3B82F6',
  marginTop: 4,
},

buttons: {
  marginTop: 'auto',
  marginBottom: 60, // subir los botones verticalmente
},

});
