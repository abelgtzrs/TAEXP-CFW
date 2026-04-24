import { Image, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  uri?: string | null;
  name?: string;
  size?: number;
};

export function Avatar({ uri, name, size = 48 }: Props) {
  const { theme } = useAppTheme();
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  if (uri) {
    return <Image source={{ uri }} style={[styles.image, { width: size, height: size, borderRadius: size / 2.5 }]} />;
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2.5,
          backgroundColor: theme.colors.surfaceMuted,
        },
      ]}
    >
      <Text style={[styles.initials, { color: theme.colors.textSecondary, fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: "cover",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontWeight: "700",
  },
});
