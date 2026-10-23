import { router } from 'expo-router';
import { useContext } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GradientButton from '../components/ui/custom/GradientButton';
import { PresupuestoContext } from '../src/context/PresupuestoContext';

export default function Tratamientos() {

  const { tratamientos, setTratamientos } = useContext(PresupuestoContext);
  const { paciente } = useContext(PresupuestoContext);

  const agregar = () => {
    const nuevo = {
      id: Date.now().toString(),
      nombre: '',
      descripcion: '',
      precio: 0
    };

    setTratamientos([...(tratamientos ?? []), nuevo]);

    router.push({
      pathname: '/editar-tratamiento',
      params: { id: nuevo.id }
    });
  };

  if (!paciente?.nombre) {
    return null;
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Tratamientos</Text>

      {/* BOTÓN ARRIBA */}
      <View style={{ marginBottom: 10 }}>
        <GradientButton
          title="+ Agregar Tratamiento"
          onPress={agregar}
          secondary
        />
      </View>

      {/* LISTA (ocupa el espacio disponible) */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={tratamientos ?? []}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{
            paddingTop: 10,
            paddingBottom: 20,
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No hay tratamientos aún
            </Text>
          }
          renderItem={({ item }: any) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                router.push({
                  pathname: '/editar-tratamiento',
                  params: { id: item.id }
                })
              }
            >
              <Text style={styles.itemTitle}>
                {item.nombre || 'Sin nombre'}
              </Text>

              <Text style={styles.itemDesc}>
                {item.descripcion || 'Sin descripción'}
              </Text>

              <Text style={styles.itemPrice}>
                ${item.precio || 0}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* BOTÓN ABAJO (YA NO ES ABSOLUTO) */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={() =>
            router.replace({
              pathname: '/resumen',
              params: { listo: 'true' }
            })
          }
        >
          <Text style={styles.buttonText}>Generar PDF</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 60,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#020617',
  },

  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#9ca3af',
  },

  item: {
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    marginBottom: 15,
    backgroundColor: '#fff',

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  itemDesc: {
    color: '#6b7280',
    marginBottom: 6,
  },

  itemPrice: {
    fontWeight: 'bold',
    color: '#2563eb',
  },

  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },

  bottomContainer: {
  paddingTop: 10,
  paddingBottom: 40, // Este de aqui es para subir el botjn de generar pdf (el verdecito)
  },

  generateButton: {
    backgroundColor: '#16a34a',
    padding: 18,
    borderRadius: 16,
  },
});