import { Stack } from 'expo-router';
import { PresupuestoProvider } from '../src/context/PresupuestoContext';

export default function Layout() {
  return (
    <PresupuestoProvider>
      <Stack
        screenOptions={{
          headerShown: false,   
          headerBackVisible: false,
        }}
      />
    </PresupuestoProvider>
  );
}