import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTechnologies } from "../../src/services/technologyService";
import { TechnologyWithCategory } from "../../src/types/technology";
import { colors, spacing, common } from "../../src/theme";

interface Section {
  title: string;
  data: TechnologyWithCategory[];
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const [allTechnologies, setAllTechnologies] = useState<TechnologyWithCategory[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data, error } = await getTechnologies();

    if (error) {
      setError(error.message);
    } else if (data) {
      setAllTechnologies(data);
    }

    setLoading(false);
    setRefreshing(false);
  }

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const sections = useMemo<Section[]>(() => {
    const filtered = search.trim()
      ? allTechnologies.filter((t) =>
          t.name.toLowerCase().includes(search.toLowerCase())
        )
      : allTechnologies;

    const grouped: Record<string, TechnologyWithCategory[]> = {};
    for (const t of filtered) {
      const catName = t.categories?.name ?? "Uncategorized";
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(t);
    }

    return Object.entries(grouped)
      .map(([title, data]) => ({ title, data }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [allTechnologies, search]);

  if (loading) {
    return (
      <View style={common.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={common.center}>
        <Text style={common.errorText}>{error}</Text>
        <TouchableOpacity
          style={common.retryButton}
          onPress={() => { setLoading(true); setError(null); loadData(); }}
          activeOpacity={0.8}
        >
          <Text style={common.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[common.safe, { paddingTop: insets.top }]}>
      <View style={common.header}>
        <Text style={common.headerTitle}>Library</Text>
        <Text style={common.headerSubtitle}>Browse technologies by category</Text>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search technologies..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {sections.length === 0 ? (
        <View style={common.center}>
          <Text style={styles.emptyText}>
            {search ? "No technologies match your search." : "No technologies found."}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          stickySectionHeadersEnabled={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={colors.card}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={common.sectionHeader}>
              <Text style={common.sectionHeaderText}>{section.title}</Text>
              <View style={common.sectionBadge}>
                <Text style={common.sectionBadgeText}>{section.data.length}</Text>
              </View>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => router.push(`/technology/${item.id}`)}
            >
              <Text style={styles.techName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.techDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <View style={styles.difficultyBadge}>
                <View
                  style={[
                    styles.difficultyDot,
                    {
                      backgroundColor:
                        item.difficulty === "Beginner"
                          ? colors.success
                          : item.difficulty === "Advanced"
                          ? colors.danger
                          : colors.info,
                    },
                  ]}
                />
                <Text style={styles.difficultyText}>{item.difficulty}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    color: colors.textMuted,
    fontSize: 18,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
  },
  clearBtn: {
    padding: spacing.xs,
  },
  clearBtnText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  techName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  techDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  difficultyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: spacing.sm + 2,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
  },
});
