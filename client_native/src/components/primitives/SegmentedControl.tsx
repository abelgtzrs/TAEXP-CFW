import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme/ThemeProvider";

type Segment<T extends string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  segments: Segment<T>[];
  selected: T;
  onSelect: (key: T) => void;
};

export function SegmentedControl<T extends string>({ segments, selected, onSelect }: Props<T>) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.track, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
      {segments.map((seg) => {
        const active = seg.key === selected;
        return (
          <Pressable
            key={seg.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(seg.key)}
            style={[styles.segment, active && { backgroundColor: theme.colors.surface }]}
          >
            <Text style={[styles.label, { color: active ? theme.colors.primary : theme.colors.textSecondary }]}>
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
});
