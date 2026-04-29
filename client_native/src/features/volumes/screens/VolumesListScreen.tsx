import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useAppTheme } from "@/theme/ThemeProvider";
import { useVolumes } from "../hooks/useVolumes";
import type { MoreStackParamList } from "@/app/navigation/types";
import type { Volume } from "@/services/contracts/volumeContract";

type Nav = NativeStackNavigationProp<MoreStackParamList, "VolumesList">;
type SortKey = "volume" | "blessings" | "lines";
type SortDir = "asc" | "desc";

function searchVolumes(volumes: Volume[], query: string): Volume[] {
  const q = query.trim().toLowerCase();
  if (!q) return volumes;
  return volumes.filter((v) => {
    if (String(v.volumeNumber).includes(q)) return true;
    if (v.title?.toLowerCase().includes(q)) return true;
    if (v.edition?.toLowerCase().includes(q)) return true;
    if (v.bodyLines?.some((l) => l.toLowerCase().includes(q))) return true;
    if (v.blessings?.some((b) => b.item?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q)))
      return true;
    return false;
  });
}

export function VolumesListScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const { data: volumes = [], isLoading, refetch } = useVolumes();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const sorted = useMemo(() => {
    let arr = searchVolumes([...volumes], search);
    arr.sort((a, b) => {
      let av = 0,
        bv = 0;
      if (sortKey === "volume") {
        av = Number(a.volumeNumber) || 0;
        bv = Number(b.volumeNumber) || 0;
      } else if (sortKey === "blessings") {
        av = a.blessings?.length || 0;
        bv = b.blessings?.length || 0;
      } else {
        av = a.bodyLines?.length || 0;
        bv = b.bodyLines?.length || 0;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return arr;
  }, [volumes, search, sortKey, sortDir]);

  const c = theme.colors;

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[s.root, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: c.border }]}>
        <Text style={[s.headerTitle, { color: c.textPrimary }]}>Greentext Volumes</Text>
        <Pressable
          style={[s.newBtn, { backgroundColor: c.primary }]}
          onPress={() => navigation.navigate("VolumeEditor", {})}
        >
          <Ionicons name="add" size={18} color={c.buttonText} />
          <Text style={[s.newBtnText, { color: c.buttonText }]}>New</Text>
        </Pressable>
      </View>

      {/* Search + Sort */}
      <View style={[s.controls, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <View style={[s.searchRow, { backgroundColor: c.surfaceMuted, borderColor: c.border }]}>
          <Ionicons name="search-outline" size={15} color={c.textTertiary} />
          <TextInput
            style={[s.searchInput, { color: c.textPrimary }]}
            placeholder="Search volumes…"
            placeholderTextColor={c.textTertiary}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>
        <View style={s.sortRow}>
          {(["volume", "blessings", "lines"] as SortKey[]).map((key) => (
            <Pressable
              key={key}
              style={[
                s.sortChip,
                {
                  borderColor: c.border,
                  backgroundColor: sortKey === key ? c.primary + "28" : c.surfaceMuted,
                },
              ]}
              onPress={() => setSortKey(key)}
            >
              <Text style={[s.sortChipText, { color: sortKey === key ? c.primary : c.textSecondary }]}>
                {key === "volume" ? "Vol #" : key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={[s.sortChip, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}
            onPress={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          >
            <Ionicons name={sortDir === "asc" ? "arrow-up" : "arrow-down"} size={14} color={c.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.primary} />}
        >
          {sorted.length === 0 ? (
            <View style={[s.empty, { borderColor: c.border }]}>
              <Ionicons name="document-text-outline" size={40} color={c.textTertiary} />
              <Text style={[s.emptyText, { color: c.textSecondary }]}>
                {search ? "No volumes match your search." : "No volumes yet. Tap New to create the first one!"}
              </Text>
            </View>
          ) : (
            sorted.map((vol) => (
              <Pressable
                key={vol._id}
                style={({ pressed }) => [
                  s.card,
                  { backgroundColor: c.surface, borderColor: c.border },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => navigation.navigate("VolumeEditor", { id: vol._id })}
              >
                {/* Card header row */}
                <View style={s.cardHeaderRow}>
                  <View style={s.cardTitleBlock}>
                    <Text style={[s.cardVolNum, { color: c.primary }]}>Vol {vol.volumeNumber}</Text>
                    <Text style={[s.cardTitle, { color: c.textPrimary }]} numberOfLines={1}>
                      {vol.title}
                    </Text>
                  </View>
                  <View
                    style={[
                      s.statusBadge,
                      {
                        backgroundColor:
                          vol.status === "published"
                            ? c.success + "22"
                            : vol.status === "archived"
                              ? c.textTertiary + "22"
                              : c.warning + "22",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.statusText,
                        {
                          color:
                            vol.status === "published"
                              ? c.success
                              : vol.status === "archived"
                                ? c.textTertiary
                                : c.warning,
                        },
                      ]}
                    >
                      {vol.status}
                    </Text>
                  </View>
                </View>

                {vol.edition ? (
                  <Text style={[s.cardEdition, { color: c.textTertiary }]} numberOfLines={1}>
                    {vol.edition}
                  </Text>
                ) : null}

                {/* Meta row */}
                <View style={s.cardMeta}>
                  <View style={s.metaItem}>
                    <Ionicons name="sparkles-outline" size={12} color={c.textTertiary} />
                    <Text style={[s.metaText, { color: c.textTertiary }]}>{vol.blessings?.length || 0} blessings</Text>
                  </View>
                  <View style={s.metaItem}>
                    <Ionicons name="reader-outline" size={12} color={c.textTertiary} />
                    <Text style={[s.metaText, { color: c.textTertiary }]}>{vol.bodyLines?.length || 0} lines</Text>
                  </View>
                  <Text style={[s.metaText, { color: c.textTertiary }]}>
                    {new Date(vol.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newBtnText: { fontSize: 14, fontWeight: "700" },
  controls: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, height: 20 },
  sortRow: { flexDirection: "row", gap: 6 },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortChipText: { fontSize: 12, fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 12, gap: 10 },
  empty: {
    marginTop: 60,
    alignItems: "center",
    gap: 12,
    padding: 32,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 5,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitleBlock: { flex: 1 },
  cardVolNum: { fontSize: 11, fontWeight: "700", marginBottom: 1 },
  cardTitle: { fontSize: 15, fontWeight: "600" },
  cardEdition: { fontSize: 11 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardMeta: { flexDirection: "row", gap: 12, marginTop: 2, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 11 },
});
