import { StyleSheet, View } from "react-native";

import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
};

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: Props) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.base,
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceMuted,
        },
        style,
      ]}
    />
  );
}

export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <Skeleton width={36} height={36} borderRadius={10} />
      <View style={styles.rowBody}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width="50%" height={16} />
      <Skeleton width="100%" height={12} />
      <Skeleton width="100%" height={48} borderRadius={14} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    opacity: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  rowBody: {
    flex: 1,
    gap: 6,
  },
  card: {
    gap: 10,
    padding: 16,
  },
});
