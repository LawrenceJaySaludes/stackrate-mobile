import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Animated,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { getTechnologies } from "../../src/services/technologyService";
import { TechnologyWithCategory } from "../../src/types/technology";
import { colors, spacing, common } from "../../src/theme";

interface Section {
  title: string;
  data: TechnologyWithCategory[];
}

function getRatingColor(rating: number): string {
  if (rating === 0) return colors.textMuted;
  if (rating < 25) return colors.danger;
  if (rating < 50) return colors.warning;
  if (rating < 75) return colors.info;
  return colors.success;
}

function getRatingLabel(rating: number): string {
  if (rating === 0) return "Not rated";
  if (rating < 25) return "Beginner";
  if (rating < 50) return "Learning";
  if (rating < 75) return "Competent";
  if (rating < 90) return "Proficient";
  return "Expert";
}

function RatingBar({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const barWidth = useRef(0);
  const animatedValue = useRef(new Animated.Value(value)).current;
  const color = getRatingColor(value);
  const label = getRatingLabel(value);

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
  }, [value]);

  const fillWidth = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  function handleTap(x: number) {
    if (barWidth.current <= 0) return;
    const pct = Math.round((x / barWidth.current) * 100);
    onChange(Math.max(0, Math.min(100, pct)));
  }

  return (
    <View style={rtStyles.container}>
      <View
        style={rtStyles.trackWrapper}
        onLayout={(e) => { barWidth.current = e.nativeEvent.layout.width; }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => handleTap(e.nativeEvent.locationX)}
        onResponderMove={(e) => handleTap(e.nativeEvent.locationX)}
      >
        <View style={rtStyles.trackBg} />
        <Animated.View
          style={[rtStyles.trackFill, { width: fillWidth, backgroundColor: color }]}
        />
        <Animated.View
          style={[
            rtStyles.thumb,
            {
              left: animatedValue.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
              backgroundColor: color,
              borderColor: color,
            },
          ]}
        />
      </View>
      <View style={rtStyles.scoreWrap}>
        <Text style={[rtStyles.score, { color }]}>{value}</Text>
        <Text style={rtStyles.scoreLabel}>{label}</Text>
      </View>
    </View>
  );
}

const rtStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 12 },
  trackWrapper: {
    flex: 1, height: 32, justifyContent: "center", position: "relative",
  },
  trackBg: { height: 6, backgroundColor: "#1E293B", borderRadius: 3 },
  trackFill: { position: "absolute", left: 0, height: 6, borderRadius: 3 },
  thumb: {
    position: "absolute", top: 6, width: 20, height: 20, borderRadius: 10,
    marginLeft: -10, borderWidth: 3,
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  scoreWrap: { alignItems: "center", width: 56 },
  score: {
    fontSize: 20, fontWeight: "800", fontVariant: ["tabular-nums"], lineHeight: 24,
  },
  scoreLabel: {
    fontSize: 9, fontWeight: "600", color: colors.textMuted,
    textTransform: "uppercase", letterSpacing: 0.5, marginTop: 1,
  },
});

export default function AssessmentScreen() {
  const insets = useSafeAreaInsets();
  const [allTech, setAllTech] = useState<TechnologyWithCategory[]>([]);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    loadData();
    return () => {
      Object.values(debounceRef.current).forEach(clearTimeout);
    };
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to rate technologies.");
        setLoading(false);
        return;
      }
      userIdRef.current = user.id;

      const { data: techData, error: techErr } = await getTechnologies();
      if (techErr) { setError(techErr.message); setLoading(false); return; }

      const { data: ratingData, error: ratingErr } = await supabase
        .from("user_ratings")
        .select("*")
        .eq("user_id", user.id);
      if (ratingErr) { setError(ratingErr.message); setLoading(false); return; }

      const ratingMap: Record<number, number> = {};
      if (ratingData) {
        for (const r of ratingData) {
          ratingMap[r.technology_id] = r.rating;
        }
      }
      setRatings(ratingMap);

      if (techData) setAllTech(techData);
    } catch (e: any) {
      setError(e.message ?? "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const sections = useMemo<Section[]>(() => {
    const grouped: Record<string, TechnologyWithCategory[]> = {};
    for (const t of allTech) {
      const catName = t.categories?.name ?? "Uncategorized";
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(t);
    }
    return Object.entries(grouped)
      .map(([title, data]) => ({ title, data }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [allTech]);

  const totalTechs = useMemo(
    () => sections.reduce((sum, s) => sum + s.data.length, 0), [sections]
  );
  const ratedCount = useMemo(
    () => Object.values(ratings).filter((r) => r > 0).length, [ratings]
  );

  const handleRatingChange = useCallback(
    (technologyId: number, newRating: number) => {
      const userId = userIdRef.current;
      if (!userId) return;

      setRatings((prev) => ({ ...prev, [technologyId]: newRating }));

      if (debounceRef.current[technologyId]) {
        clearTimeout(debounceRef.current[technologyId]);
      }

      debounceRef.current[technologyId] = setTimeout(async () => {
        setSaving((prev) => ({ ...prev, [technologyId]: true }));
        const { error: saveErr } = await supabase
          .from("user_ratings")
          .upsert(
            { user_id: userId, technology_id: technologyId, rating: newRating },
            { onConflict: "user_id,technology_id" }
          );
        setSaving((prev) => ({ ...prev, [technologyId]: false }));
        if (saveErr) Alert.alert("Failed to save", saveErr.message);
      }, 500);
    },
    []
  );

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
          <Text style={common.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={common.center}>
        <Text style={styles.emptyTitle}>Self Assessment</Text>
        <Text style={styles.emptyText}>No technologies found.</Text>
      </View>
    );
  }

  return (
    <View style={[common.safe, { paddingTop: insets.top }]}>
      <View style={common.header}>
        <Text style={common.headerTitle}>Self Assessment</Text>
        <Text style={common.headerSubtitle}>Rate your skill level for each technology</Text>
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ratedCount}/{totalTechs}</Text>
            <Text style={styles.statLabel}>Rated</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {ratedCount > 0
                ? Math.round(Object.values(ratings).reduce((a, b) => a + b, 0) / ratedCount)
                : "—"}
            </Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
        </View>
      </View>

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
        renderItem={({ item }) => {
          const rating = ratings[item.id] ?? 0;
          const isSaving = saving[item.id] ?? false;

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.techName}>{item.name}</Text>
                {isSaving && (
                  <ActivityIndicator size="small" color={colors.accent} />
                )}
              </View>
              <Text style={styles.techDesc} numberOfLines={1}>
                {item.description}
              </Text>
              <RatingBar
                value={rating}
                onChange={(v) => handleRatingChange(item.id, v)}
              />
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  statsBar: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: {
    color: colors.textPrimary, fontSize: 20, fontWeight: "800",
  },
  statLabel: {
    color: colors.textMuted, fontSize: 11, fontWeight: "600",
    textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2,
  },
  statDivider: {
    width: 1, backgroundColor: colors.cardBorder, marginVertical: 4,
  },
  listContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
  card: {
    backgroundColor: colors.card, borderRadius: 14, padding: spacing.lg,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder,
  },
  cardTop: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  techName: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  techDesc: {
    color: colors.textSecondary, fontSize: 13, marginTop: 2, marginBottom: spacing.sm + 2,
  },
  emptyTitle: {
    color: colors.textPrimary, fontSize: 20, fontWeight: "700", marginBottom: spacing.sm,
  },
  emptyText: { color: colors.textSecondary, fontSize: 14, textAlign: "center" },
});
