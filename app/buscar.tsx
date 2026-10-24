import { router } from 'expo-router';
import { useState } from 'react';

import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { usePresupuesto } from '../src/context/PresupuestoContext';
import { calcularTotal } from '../src/domain/calculos';
import { formatCurrency } from '../src/lib/currency';
import { sharePresupuestoPdf } from '../src/services/pdf/sharePresupuestoPdf';
import type { Presupuesto } from '../src/types';

export default function Buscar() {

  const { presupuestos, eliminarPresupuesto,setEditandoId, setPaciente, setTratamientos } = usePresupuesto();
  const [busqueda, setBusqueda] = useState('');

  const filtrados = presupuestos.filter((p) =>
    p.paciente.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirPDF = async (pdfUri: string) => {
    try {
      const resultado = await sharePresupuestoPdf(pdfUri);

      if (resultado === 'missing-uri') {
        Alert.alert(
          'PDF no disponible',
          'Este presupuesto se guardó sin PDF. Edítalo y genera uno nuevo.'
        );
        return;
      }

      if (resultado === 'not-found') {
        Alert.alert('Error', 'El archivo PDF no existe');
        return;
      }

      if (resultado === 'invalid-uri' || resultado === 'unreadable') {
        Alert.alert(
          'PDF no disponible',
          'El archivo PDF no es accesible. Edita el presupuesto y genera uno nuevo.'
        );
        return;
      }

      if (resultado === 'sharing-unavailable') {
        Alert.alert(
          'Error',
          'Compartir no está disponible en este dispositivo'
        );
      }
    } catch (error) {
      console.error('Error abriendo PDF:', error);
      Alert.alert('Error', 'No se pudo abrir el PDF');
    }
  };

  const confirmarEliminar = (id: string) => {
    Alert.alert(
      'Eliminar',
      '¿Seguro que quieres borrar este presupuesto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => eliminarPresupuesto(id)
        }
      ]
    );
  };
         const editarPresupuesto = (item: Presupuesto) => {
          setPaciente(item.paciente);
          setTratamientos(item.tratamientos);
          setEditandoId(item.id); // 🔥 clave

          router.replace('/tratamientos');
        };

  return (
      
    <View style={styles.container}>

      <Text style={styles.title}>Buscar Presupuesto</Text>

      <TextInput
        placeholder="Buscar paciente..."
        style={styles.input}
        value={busqueda}
        onChangeText={setBusqueda}
      />

      <FlatList
        data={filtrados}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>No hay resultados</Text>}


        renderItem={({ item }) => (
          <View style={styles.item}>

            <TouchableOpacity onPress={() => abrirPDF(item.pdf)}>
              <Text style={styles.name}>{item.paciente.nombre}</Text>
              <Text style={styles.total}>${formatCurrency(calcularTotal(item.tratamientos))} mxn</Text>
              <Text style={styles.date}>{item.fecha}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.editBtn} onPress={() => editarPresupuesto(item)}>
            <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>

            {/* 🔥 BOTÓN ELIMINAR */}
            
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => confirmarEliminar(item.id)}
            >
              <Text style={styles.deleteText}>Eliminar</Text>
            </TouchableOpacity>

          </View>
        )}
      />

    </View>
  );
}
const styles = StyleSheet.create({
  container: {
  flex: 1,
  paddingHorizontal: 20,
  paddingTop: 75, //
  backgroundColor: '#F8FAFC',
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15
  },

  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#fff'
  },

  item: {
    padding: 15,
    borderRadius: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',

    shadowColor: '#2563eb',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3
  },

  name: {
    fontWeight: 'bold',
    fontSize: 16
  },

  total: {
    color: '#2563eb',
    fontWeight: 'bold'
  },

  date: {
    color: '#6b7280'
  },

  deleteBtn: {
    marginTop: 10,
    backgroundColor: '#ef4444',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center'
  },

  deleteText: {
    color: 'white',
    fontWeight: 'bold'
  },

  editBtn: {
  backgroundColor: '#16a34a',
  padding: 9,
  borderRadius: 8,
  marginTop: 10
  },

  editText: {
  color: 'white',
  textAlign: 'center',
  fontWeight: 'bold'
  },


});