import { useQuery } from "@tanstack/react-query";
import { Image, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/primitives/AppButton";
import { AppCard } from "@/components/primitives/AppCard";
import { Screen } from "@/components/primitives/Screen";
import { useAuth } from "@/features/auth/context/AuthContext";
import { fetchCurrentUserProfile } from "@/services/contracts/userContract";
import { buildPublicAssetUrl } from "@/utils/assets";
import { useAppTheme } from "@/theme/ThemeProvider";

export function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const { theme } = useAppTheme();

  const profileQuery = useQuery({
    queryKey: ["profile.me"],
    queryFn: fetchCurrentUserProfile,
    initialData: user ?? undefined,
  });

  const profile = profileQuery.data;
  const avatarUrl = profile?.profilePicture ? buildPublicAssetUrl(profile.profilePicture) : null;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Profile</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          This starter screen confirms the populated session profile is available in native code.
        </Text>
      </View>

      <AppCard title={profile?.username ?? "User"} subtitle={profile?.email ?? "No email available"}>
        <View style={styles.identityRow}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.colors.surfaceMuted }]} />
          )}
          <View style={styles.identityCopy}>
            <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>Role</Text>
            <Text style={[styles.metaValue, { color: theme.colors.textPrimary }]}>{profile?.role ?? "user"}</Text>
            <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>Persona</Text>
            <Text style={[styles.metaValue, { color: theme.colors.textPrimary }]}>
              {profile?.activeAbelPersona?.name ?? "Default system theme"}
            </Text>
          </View>
        </View>
        <AppButton onPress={() => void refreshUser()} title="Refresh profile" variant="secondary" />
      </AppCard>

      <AppCard title="Collections Snapshot" subtitle="A full collections hub lands in the next implementation phase.">
        <View style={styles.metricRow}>
          <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>Pokemon</Text>
          <Text style={[styles.metaValue, { color: theme.colors.textPrimary }]}>
            {profile?.pokemonCollection?.length ?? 0}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>Snoopy</Text>
          <Text style={[styles.metaValue, { color: theme.colors.textPrimary }]}>
            {profile?.snoopyArtCollection?.length ?? 0}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>Habbo</Text>
          <Text style={[styles.metaValue, { color: theme.colors.textPrimary }]}>
            {profile?.habboRares?.length ?? 0}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>Badges</Text>
          <Text style={[styles.metaValue, { color: theme.colors.textPrimary }]}>{profile?.badges?.length ?? 0}</Text>
        </View>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  identityRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  identityCopy: {
    flex: 1,
    gap: 6,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaLabel: {
    fontSize: 14,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "700",
  },
});
