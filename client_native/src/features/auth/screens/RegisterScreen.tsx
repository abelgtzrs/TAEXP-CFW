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

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const { theme } = useAppTheme();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await register({ username: username.trim(), email: email.trim(), password });
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Registration failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Create your account</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Registration is wired to the same auth backend as the web client.</Text>
      </View>

      <AppCard title="Register" subtitle="This flow can be disabled later if the product requires invite-only access.">
        <AppTextField label="Username" onChangeText={setUsername} placeholder="abel" value={username} />
        <AppTextField
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="you@example.com"
          value={email}
        />
        <AppTextField label="Password" onChangeText={setPassword} placeholder="Password" secureTextEntry value={password} />
        {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
        <AppButton loading={submitting} onPress={handleSubmit} title="Create account" />
        <AppButton onPress={() => navigation.goBack()} title="Back to login" variant="secondary" />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center"
  },
  hero: {
    gap: 6
  },
  title: {
    fontSize: 28,
    fontWeight: "800"
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22
  },
  error: {
    fontSize: 13
  }
});