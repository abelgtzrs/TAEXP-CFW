import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useAppTheme } from "@/theme/ThemeProvider";
import type { AppTheme } from "@/theme/tokens";
import { useVolumes, useCreateVolume, useUpdateVolume, useDeleteVolume } from "../hooks/useVolumes";
import { parseRawGreentext } from "@/utils/greentextParser";
import {
  INITIAL_VOLUME_FORM,
  toFormData,
  toPayload,
  type Blessing,
  type VolumeFormData,
} from "@/services/contracts/volumeContract";
import type { MoreStackParamList } from "@/app/navigation/types";

type Nav = NativeStackNavigationProp<MoreStackParamList, "VolumeEditor">;
type Route = RouteProp<MoreStackParamList, "VolumeEditor">;
type Tab = "raw" | "preview" | "fields" | "blessings";
type Colors = AppTheme["colors"];

const TABS: Tab[] = ["raw", "preview", "fields", "blessings"];
const STATUSES = ["draft", "published", "archived"] as const;

// ── Main Screen ───────────────────────────────────────

export function VolumeEditorScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const editId = route.params?.id;

  const { data: volumes = [] } = useVolumes();
  const createMutation = useCreateVolume();
  const updateMutation = useUpdateVolume();
  const deleteMutation = useDeleteVolume();

  const [form, setForm] = useState<VolumeFormData>(INITIAL_VOLUME_FORM);
  const [activeTab, setActiveTab] = useState<Tab>("raw");
  const [toast, setToast] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (editId && volumes.length > 0) {
      const vol = volumes.find((v) => v._id === editId);
      if (vol) setForm(toFormData(vol));
    }
  }, [editId, volumes]);

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const setField = <K extends keyof VolumeFormData>(key: K, value: VolumeFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Parse raw text → fields ──
  const handleParse = () => {
    const parsed = parseRawGreentext(form.rawPastedText);
    setForm((prev) => ({
      ...prev,
      volumeNumber: parsed.volumeNumber ?? "",
      title: parsed.title ?? "",
      bodyText: (parsed.bodyLines || []).join("\n"),
      blessingIntro: parsed.blessingIntro ?? "",
      blessings: parsed.blessings.map((b) => ({
        item: b.item,
        description: b.description,
        context: "",
      })),
      dream: parsed.dream ?? "",
      edition: parsed.edition ?? "",
    }));
    setActiveTab("fields");
    setToast("✓ Parsed successfully");
  };

  // ── Save ──
  const handleSave = async () => {
    if (!String(form.volumeNumber).trim()) {
      Alert.alert("Required", "Volume number is required.");
      return;
    }
    if (!form.title.trim()) {
      Alert.alert("Required", "Title is required.");
      return;
    }
    if (!form.rawPastedText.trim()) {
      Alert.alert("Required", "Raw pasted text is required.");
      return;
    }
    const payload = toPayload(form);
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, payload });
        setToast("✓ Volume updated");
      } else {
        await createMutation.mutateAsync(payload);
        navigation.goBack();
      }
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Save failed";
      Alert.alert("Error", msg);
    }
  };

  // ── Delete ──
  const handleDelete = () => {
    if (!editId) return;
    Alert.alert("Delete Volume", "Permanently delete this volume?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(editId);
            navigation.goBack();
          } catch {
            Alert.alert("Error", "Failed to delete.");
          }
        },
      },
    ]);
  };

  // ── Blessing helpers ──
  const blessings: Blessing[] = Array.isArray(form.blessings) ? form.blessings : [];
  const updateBlessing = (idx: number, field: keyof Blessing, value: string) => {
    const next = [...blessings];
    next[idx] = { ...next[idx], [field]: value };
    setField("blessings", next);
  };
  const addBlessing = () => setField("blessings", [...blessings, { item: "", description: "", context: "" }]);
  const removeBlessing = (idx: number) =>
    setField(
      "blessings",
      blessings.filter((_, i) => i !== idx),
    );
  const moveBlessing = (idx: number, dir: 1 | -1) => {
    const next = [...blessings];
    const to = idx + dir;
    if (to < 0 || to >= next.length) return;
    [next[idx], next[to]] = [next[to], next[idx]];
    setField("blessings", next);
  };

  const c = theme.colors;
  const headerTitle = editId ? (form.volumeNumber ? `Vol ${form.volumeNumber}` : "Edit Volume") : "New Volume";

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[st.root, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[st.header, { borderBottomColor: c.border }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={st.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={c.textPrimary} />
        </Pressable>
        <Text style={[st.headerTitle, { color: c.textPrimary }]} numberOfLines={1}>
          {headerTitle}
        </Text>
        <View style={st.headerRight}>
          {isPending ? (
            <ActivityIndicator size="small" color={c.primary} />
          ) : (
            <>
              {editId && (
                <Pressable onPress={handleDelete} hitSlop={10} style={st.headerBtn}>
                  <Ionicons name="trash-outline" size={20} color={c.danger} />
                </Pressable>
              )}
              <Pressable style={[st.saveBtn, { backgroundColor: c.primary }]} onPress={handleSave}>
                <Text style={[st.saveBtnText, { color: c.buttonText }]}>{editId ? "Update" : "Create"}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* Toast */}
      {!!toast && (
        <View style={[st.toast, { backgroundColor: c.surface, borderColor: c.primary }]}>
          <Text style={[st.toastText, { color: c.primary }]}>{toast}</Text>
        </View>
      )}

      {/* Tab Bar */}
      <View style={[st.tabBar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            style={[
              st.tabItem,
              activeTab === tab && {
                borderBottomColor: c.primary,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[st.tabLabel, { color: activeTab === tab ? c.primary : c.textSecondary }]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "blessings" && blessings.length > 0 ? ` (${blessings.length})` : ""}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        {activeTab === "raw" && <RawTab c={c} form={form} setField={setField} onParse={handleParse} />}
        {activeTab === "preview" && <PreviewTab c={c} form={form} />}
        {activeTab === "fields" && <FieldsTab c={c} form={form} setField={setField} />}
        {activeTab === "blessings" && (
          <BlessingsTab
            c={c}
            blessings={blessings}
            onUpdate={updateBlessing}
            onAdd={addBlessing}
            onRemove={removeBlessing}
            onMove={moveBlessing}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Raw Tab ───────────────────────────────────────────

function RawTab({
  c,
  form,
  setField,
  onParse,
}: {
  c: Colors;
  form: VolumeFormData;
  setField: <K extends keyof VolumeFormData>(k: K, v: VolumeFormData[K]) => void;
  onParse: () => void;
}) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 12, gap: 10 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ color: c.textSecondary, fontSize: 13, lineHeight: 18 }}>
        Paste raw greentext below, then tap "Parse → Fields" to extract structured data automatically.
      </Text>
      <TextInput
        style={{
          backgroundColor: c.surface,
          borderColor: c.border,
          borderWidth: 1,
          borderRadius: 12,
          color: c.textPrimary,
          fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
          fontSize: 13,
          lineHeight: 20,
          minHeight: 340,
          padding: 12,
          textAlignVertical: "top",
        }}
        multiline
        value={form.rawPastedText}
        onChangeText={(v) => setField("rawPastedText", v)}
        placeholder="Paste raw greentext here…"
        placeholderTextColor={c.textTertiary}
        scrollEnabled={false}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable
        style={({ pressed }) => ({
          backgroundColor: pressed ? c.primary + "cc" : c.primary,
          borderRadius: 12,
          paddingVertical: 13,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          marginTop: 4,
        })}
        onPress={onParse}
      >
        <Ionicons name="git-branch-outline" size={18} color={c.buttonText} />
        <Text style={{ color: c.buttonText, fontWeight: "700", fontSize: 15 }}>Parse → Fields</Text>
      </Pressable>
    </ScrollView>
  );
}

// ── Preview Tab ───────────────────────────────────────

function PreviewTab({ c, form }: { c: Colors; form: VolumeFormData }) {
  const volNum = form.volumeNumber;
  const title = form.title || "Untitled";
  const bodyLines = (form.bodyText || "").split(/\r?\n/);
  const blessings: Blessing[] = Array.isArray(form.blessings) ? form.blessings : [];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 2 }}>
      {/* Header */}
      <Text
        style={{
          color: c.textPrimary,
          fontWeight: "700",
          fontSize: 14,
          marginBottom: 8,
          fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        }}
      >
        The Abel Experience™: Volume {volNum}: {title}
      </Text>

      {/* Body */}
      {bodyLines.map((line, i) => {
        const isEmpty = !line.trim();
        return (
          <Text
            key={i}
            style={{
              color: isEmpty ? "transparent" : c.primary,
              fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
              fontSize: 13,
              lineHeight: 22,
            }}
          >
            {isEmpty ? "." : `> ${line}`}
          </Text>
        );
      })}

      {/* Blessing intro */}
      {!!form.blessingIntro && (
        <>
          <Text style={{ height: 12 }} />
          <Text
            style={{
              color: c.textPrimary,
              fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
              fontSize: 13,
              lineHeight: 22,
              fontStyle: "italic",
            }}
          >
            {form.blessingIntro}
          </Text>
        </>
      )}

      {/* Blessings */}
      {blessings.length > 0 && (
        <>
          <Text style={{ height: 8 }} />
          {blessings.map((b, i) => (
            <Text
              key={i}
              style={{
                color: c.textSecondary,
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                fontSize: 13,
                lineHeight: 22,
              }}
            >
              {b.item}
              {b.description ? ` - ${b.description}` : ""}
            </Text>
          ))}
        </>
      )}

      {/* Dream */}
      {!!form.dream && (
        <>
          <Text style={{ height: 12 }} />
          <Text
            style={{
              color: c.textSecondary,
              fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
              fontSize: 13,
              lineHeight: 22,
              fontStyle: "italic",
            }}
          >
            {form.dream}
          </Text>
        </>
      )}

      {/* Footer */}
      <Text style={{ height: 16 }} />
      <Text
        style={{
          color: c.textTertiary,
          fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
          fontSize: 13,
        }}
      >
        The Abel Experience™:{form.edition ? ` ${form.edition}` : ""}
      </Text>
      <Text style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── Fields Tab ────────────────────────────────────────

function FieldsTab({
  c,
  form,
  setField,
}: {
  c: Colors;
  form: VolumeFormData;
  setField: <K extends keyof VolumeFormData>(k: K, v: VolumeFormData[K]) => void;
}) {
  const inputStyle = {
    backgroundColor: c.surface,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: 10,
    color: c.textPrimary,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  };
  const labelStyle = { color: c.textSecondary, fontSize: 12, fontWeight: "600" as const, marginBottom: 4 };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 12, gap: 14 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Vol # + Title row */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ width: 80 }}>
          <Text style={labelStyle}>Vol #</Text>
          <TextInput
            style={inputStyle}
            value={String(form.volumeNumber)}
            onChangeText={(v) => setField("volumeNumber", v)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={c.textTertiary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>Title</Text>
          <TextInput
            style={inputStyle}
            value={form.title}
            onChangeText={(v) => setField("title", v)}
            placeholder="Volume title"
            placeholderTextColor={c.textTertiary}
          />
        </View>
      </View>

      {/* Status */}
      <View>
        <Text style={labelStyle}>Status</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {STATUSES.map((s) => (
            <Pressable
              key={s}
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: 10,
                borderWidth: 1,
                alignItems: "center",
                borderColor: form.status === s ? c.primary : c.border,
                backgroundColor: form.status === s ? c.primary + "22" : c.surface,
              }}
              onPress={() => setField("status", s)}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: form.status === s ? c.primary : c.textSecondary,
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Edition */}
      <View>
        <Text style={labelStyle}>Edition</Text>
        <TextInput
          style={inputStyle}
          value={form.edition}
          onChangeText={(v) => setField("edition", v)}
          placeholder="e.g. Gold Edition"
          placeholderTextColor={c.textTertiary}
        />
      </View>

      {/* Body Text */}
      <View>
        <Text style={labelStyle}>Body Lines</Text>
        <TextInput
          style={{
            ...inputStyle,
            minHeight: 180,
            textAlignVertical: "top",
            fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
            fontSize: 12,
            lineHeight: 20,
          }}
          multiline
          value={form.bodyText}
          onChangeText={(v) => setField("bodyText", v)}
          placeholder="One line per body line of the greentext…"
          placeholderTextColor={c.textTertiary}
          scrollEnabled={false}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Blessing Intro */}
      <View>
        <Text style={labelStyle}>Blessing Intro</Text>
        <TextInput
          style={inputStyle}
          value={form.blessingIntro}
          onChangeText={(v) => setField("blessingIntro", v)}
          placeholder="e.g. Life is good."
          placeholderTextColor={c.textTertiary}
        />
      </View>

      {/* Dream */}
      <View>
        <Text style={labelStyle}>Dream</Text>
        <TextInput
          style={inputStyle}
          value={form.dream}
          onChangeText={(v) => setField("dream", v)}
          placeholder="e.g. The dream of a better life."
          placeholderTextColor={c.textTertiary}
        />
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ── Blessings Tab ─────────────────────────────────────

function BlessingsTab({
  c,
  blessings,
  onUpdate,
  onAdd,
  onRemove,
  onMove,
}: {
  c: Colors;
  blessings: Blessing[];
  onUpdate: (idx: number, field: keyof Blessing, value: string) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onMove: (idx: number, dir: 1 | -1) => void;
}) {
  const inputStyle = {
    flex: 1,
    backgroundColor: c.surfaceMuted,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: 8,
    color: c.textPrimary,
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 8,
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 12, gap: 10 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Add button */}
      <Pressable
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 11,
          borderRadius: 12,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: c.primary,
          backgroundColor: pressed ? c.primary + "18" : "transparent",
        })}
        onPress={onAdd}
      >
        <Ionicons name="add-circle-outline" size={18} color={c.primary} />
        <Text style={{ color: c.primary, fontWeight: "600", fontSize: 14 }}>Add Blessing</Text>
      </Pressable>

      {blessings.length === 0 && (
        <Text
          style={{
            textAlign: "center",
            color: c.textTertiary,
            fontSize: 13,
            marginTop: 20,
          }}
        >
          No blessings yet. Tap above to add one, or use Parse on the Raw tab.
        </Text>
      )}

      {blessings.map((blessing, idx) => (
        <View
          key={idx}
          style={{
            backgroundColor: c.surface,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            gap: 8,
          }}
        >
          {/* Index + move/delete controls */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: c.primary, fontSize: 11, fontWeight: "700" }}>#{idx + 1}</Text>
            <View style={{ flexDirection: "row", gap: 4 }}>
              <Pressable
                hitSlop={8}
                onPress={() => onMove(idx, -1)}
                disabled={idx === 0}
                style={{ opacity: idx === 0 ? 0.3 : 1 }}
              >
                <Ionicons name="chevron-up" size={18} color={c.textSecondary} />
              </Pressable>
              <Pressable
                hitSlop={8}
                onPress={() => onMove(idx, 1)}
                disabled={idx === blessings.length - 1}
                style={{ opacity: idx === blessings.length - 1 ? 0.3 : 1 }}
              >
                <Ionicons name="chevron-down" size={18} color={c.textSecondary} />
              </Pressable>
              <Pressable hitSlop={8} onPress={() => onRemove(idx)}>
                <Ionicons name="close-circle" size={18} color={c.danger} />
              </Pressable>
            </View>
          </View>

          {/* Item */}
          <TextInput
            style={inputStyle}
            value={blessing.item}
            onChangeText={(v) => onUpdate(idx, "item", v)}
            placeholder="Blessing name"
            placeholderTextColor={c.textTertiary}
          />

          {/* Description */}
          <TextInput
            style={inputStyle}
            value={blessing.description}
            onChangeText={(v) => onUpdate(idx, "description", v)}
            placeholder="Description (optional)"
            placeholderTextColor={c.textTertiary}
          />

          {/* Context */}
          <TextInput
            style={{ ...inputStyle, fontSize: 12 }}
            value={blessing.context ?? ""}
            onChangeText={(v) => onUpdate(idx, "context", v)}
            placeholder="Context / lore note (optional)"
            placeholderTextColor={c.textTertiary}
            multiline
            scrollEnabled={false}
          />
        </View>
      ))}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────

const st = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  headerBtn: { padding: 2 },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  saveBtnText: { fontSize: 14, fontWeight: "700" },
  toast: {
    marginHorizontal: 16,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  toastText: { fontSize: 13, fontWeight: "600" },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});
