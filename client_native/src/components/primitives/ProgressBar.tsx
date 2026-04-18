import { StyleSheet, View } from "react-native";

import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  progress: number; // 0–1
  height?: number;
  color?: string;
};

export function ProgressBar({ progress, height = 8, color }: Props) {
  const { theme } = useAppTheme();
  const fill = Math.max(0, Math.min(1, progress));
  const barColor = color ?? theme.colors.primary;

  return (
    <View style={[styles.track, { height, backgroundColor: theme.colors.surfaceMuted }]}>
      <View
        style={[
          styles.fill,
          {
            height,
            backgroundColor: barColor,
            width: `${fill * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    borderRadius: 999,
  },
});
