import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { useState } from "react";
import { Pressable, Text } from "react-native";

export default function GradientButton({
  title,
  onPress,
  secondary = false
}: any) {
  const [pressed, setPressed] = useState(false);

  // 🎨 colores dinámicos
  const gradientColors = secondary
    ? ["#93C5FD", "#67E8F9"] // suave
    : ["#3B82F6", "#22D3EE"]; // fuerte

  const glowColor = secondary ? "#67E8F9" : "#22D3EE";

  const textColor = secondary ? "#0F172A" : "#fff";

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{ width: "100%" }}
    >
      <MotiView
        animate={{
          scale: pressed ? 0.97 : 1,
        }}
        transition={{
          type: "timing",
          duration: 120,
        }}
      >
        {/* Glow */}
        <MotiView
          animate={{
            opacity: pressed ? 0.4 : 0.2,
            scale: pressed ? 0.98 : 1,
          }}
          transition={{
            type: "timing",
            duration: 200,
          }}
          style={{
            position: "absolute",
            width: "100%",
            height: 60,
            borderRadius: 16,
            backgroundColor: glowColor,
          }}
        />

        {/* Botón */}
        <LinearGradient
          colors={gradientColors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingVertical: 18,
            borderRadius: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: textColor,
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            {title}
          </Text>
        </LinearGradient>
      </MotiView>
    </Pressable>
  );
}