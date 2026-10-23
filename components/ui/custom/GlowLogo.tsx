import { useFocusEffect } from 'expo-router';
import { MotiView, type MotiTransitionProp } from "moti";
import { useCallback, useEffect, useState } from "react";
import { Image, View } from "react-native";

// Moti 0.30 tipa `transition` de forma incompatible con RN 0.88.
// El objeto es válido en runtime; el cast mantiene el tipado sin usar `any`.
const AURA_TRANSITION = {
  type: "timing",
  duration: 2200,
  loop: true,
} as MotiTransitionProp;

const SECONDARY_AURA_TRANSITION = {
  type: "timing",
  duration: 3000,
  loop: true,
} as MotiTransitionProp;

export default function GlowLogo() {
  const [mounted, setMounted] = useState(false);

    const [key, setKey] = useState(0);

    useFocusEffect(
    useCallback(() => {
        setKey(prev => prev + 1);
    }, [])
    );

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <View key={key} style={{ alignItems: "center", justifyContent: "center" }}>
      
      {/* Aura principal */}
      <MotiView
        from={{ scale: 0.9, opacity: 0.4 }}
        animate={
          mounted
            ? { scale: 1.3, opacity: 0.1 }
            : { scale: 0.9, opacity: 0.4 }
        }
        transition={AURA_TRANSITION}
        style={{
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: 100,
          backgroundColor: "#3B82F6",
        }}
      />

      {/* Aura secundaria */}
      <MotiView
        from={{ scale: 1, opacity: 0.25 }}
        animate={
          mounted
            ? { scale: 1.6, opacity: 0.05 }
            : { scale: 1, opacity: 0.25 }
        }
        transition={SECONDARY_AURA_TRANSITION}
        style={{
          position: "absolute",
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: "#22D3EE",
        }}
      />

      {/* Logo */}
      <Image
        source={require("../../../assets/images/logo.png")}
        style={{
          width: 120,
          height: 120,
          resizeMode: "contain",
        }}
      />
    </View>
  );
}