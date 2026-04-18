import { forwardRef } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { useAppTheme } from "@/theme/ThemeProvider";

type AppTextFieldProps = TextInputProps & {
  label?: string;
  error?: string | null;
};

export const AppTextField = forwardRef<TextInput, AppTextFieldProps>(function AppTextField(
  { label, error, style, ...props },
  ref,
) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={theme.colors.textTertiary}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            color: theme.colors.textPrimary
          },
          style,
        ]}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 6
  },
  label: {
    fontSize: 13,
    fontWeight: "600"
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15
  },
  error: {
    fontSize: 12
  }
});