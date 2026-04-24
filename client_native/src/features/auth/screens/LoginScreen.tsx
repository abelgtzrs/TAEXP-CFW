import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/primitives/AppButton";
import { AppCard } from "@/components/primitives/AppCard";
import { AppTextField } from "@/components/primitives/AppTextField";
import { Screen } from "@/components/primitives/Screen";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useAppTheme } from "@/theme/ThemeProvider";

import type { AuthStackParamList } from "@/app/navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { theme } = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await login({ email: email.trim(), password });
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Login failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>TAE Native</Text>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Sign in to your dashboard</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          EPIC-0 shell with secure auth and native theming is ready.
        </Text>
      </View>

      <AppCard title="Login" subtitle="Use the same backend account as the web app." style={styles.card}>
        <AppTextField
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="you@example.com"
          value={email}
        />
        <AppTextField
          label="Password"
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          value={password}
        />
        {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
        <AppButton loading={submitting} onPress={handleSubmit} title="Sign in" />
        <AppButton onPress={() => navigation.navigate("Register")} title="Create account" variant="secondary" />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
  },
  hero: {
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    marginTop: 8,
  },
  error: {
    fontSize: 13,
  },
});
