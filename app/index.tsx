import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import GlowLogo from '../components/ui/custom/GlowLogo';
import GradientButton from '../components/ui/custom/GradientButton';

export default function Home() {
  return (
    <View style={styles.container}>

      {/* ZONA SUPERIOR */}
      <View style={styles.topSection}>
        <GlowLogo />

        <Text style={styles.title}>Clínica Dental</Text>
      </View>

      {/* ZONA INFERIOR */}
      <View style={styles.bottomSection}>

        {/* BOTÓN PREMIUM */}
        <GradientButton
          title="Nuevo Presupuesto"
          onPress={() => router.push('/nuevo-presupuesto')}
        />

        {/* BOTÓN SECUNDARIO */}
        <View style={{ height: 14 }} />

        <Pressable
          style={({ pressed }) => [
            styles.buttonSecondary,
            { opacity: pressed ? 0.85 : 1 }
          ]}
          onPress={() => router.push('/buscar')}
        >
          <Text style={styles.buttonText}>
            Buscar Presupuesto
          </Text>
        </Pressable>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20
  },

  // 🔝 LOGO + TEXTO
  topSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center'
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#020617',
    marginTop: 55
  },

  // 🔘 BOTONES
  bottomSection: {
    flex: 0.8,
    justifyContent: 'center',
    marginBottom: 60
  },

  buttonSecondary: {
    width: '100%',
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#64748B',
    alignItems: 'center'
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  }
});