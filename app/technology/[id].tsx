import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import {
  getTechnologyById,
  getNotes,
  saveNotes,
} from "../../src/services/technologyService";
import { TechnologyWithCategory } from "../../src/types/technology";
import { colors, spacing, common } from "../../src/theme";

function getDifficultyColor(difficulty: string): string {
  switch (difficulty?.toLowerCase()) {
    case "beginner": return colors.success;
    case "intermediate": return colors.info;
    case "advanced": return colors.danger;
    default: return colors.textSecondary;
  }
}

export default function TechnologyDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tech, setTech] = useState<TechnologyWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    if (!id) return;

    const { data, error } = await getTechnologyById(Number(id));

    if (error) {
      setError(error.message);
    } else {
      setTech(data);
    }

    setLoading(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: notesData, error: notesErr } = await getNotes(user.id, Number(id));
      if (!notesErr && notesData) {
        setNotes(notesData.notes);
      }
    }

    setNotesLoading(false);
  }

  async function handleSaveNotes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !id) return;

    setNotesSaving(true);
    setNotesError(null);
    setNotesSaved(false);

    const { error } = await saveNotes(user.id, Number(id), notes);

    if (error) {
      setNotesError(error.message);
    } else {
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    }

    setNotesSaving(false);
  }

  if (loading) {
    return (
      <View style={[common.safe, { paddingTop: insets.top }]}>
        <View style={common.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  if (error || !tech) {
    return (
      <View style={[common.safe, { paddingTop: insets.top }]}>
        <View style={common.center}>
          <Text style={[common.errorText, { marginBottom: spacing.lg }]}>
            {error ?? "Technology not found"}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const diffColor = getDifficultyColor(tech.difficulty);

  return (
    <View style={[common.safe, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backArrow}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.techName}>{tech.name}</Text>
          {tech.categories && (
            <View style={common.pill}>
              <Text style={common.pillText}>{tech.categories.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.metaBadge, { backgroundColor: diffColor + "1A" }]}>
            <View style={[styles.metaDot, { backgroundColor: diffColor }]} />
            <Text style={[styles.metaText, { color: diffColor }]}>
              {tech.difficulty}
            </Text>
          </View>
        </View>

        {tech.description ? (
          <View style={common.card}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>{tech.description}</Text>
          </View>
        ) : null}

        <View style={[common.card, styles.notesCard]}>
          <Text style={styles.infoLabel}>Notes</Text>

          {notesLoading ? (
            <ActivityIndicator size="small" color={colors.accent} style={styles.notesLoader} />
          ) : (
            <>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={(text) => {
                  setNotes(text);
                  if (notesSaved) setNotesSaved(false);
                }}
                placeholder="Write your notes about this technology..."
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
              />

              <View style={styles.notesFooter}>
                {notesError ? (
                  <Text style={styles.notesErrorText}>{notesError}</Text>
                ) : notesSaved ? (
                  <Text style={styles.notesSavedText}>Notes saved</Text>
                ) : (
                  <View style={{ flex: 1 }} />
                )}

                <TouchableOpacity
                  style={[styles.saveButton, notesSaving && styles.saveButtonDisabled]}
                  onPress={handleSaveNotes}
                  disabled={notesSaving}
                  activeOpacity={0.8}
                >
                  {notesSaving ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  backArrow: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "600",
  },
  titleSection: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  techName: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  metaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "600",
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  backButtonText: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  notesCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  notesLoader: {
    paddingVertical: spacing.xxl,
  },
  notesInput: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 120,
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginTop: spacing.sm,
  },
  notesFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    minHeight: 36,
  },
  notesErrorText: {
    color: colors.danger,
    fontSize: 13,
    flex: 1,
  },
  notesSavedText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  saveButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
});
