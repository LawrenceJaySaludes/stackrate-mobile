import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { getRoles, getTechnologies } from "../../src/services/technologyService";
import { Role, RoleWithRequirements, SkillGap, MatchResult } from "../../src/types/technology";
import { colors, spacing, common } from "../../src/theme";

function calculateMatch(
  role: RoleWithRequirements,
  ratings: Record<number, number>
): MatchResult {
  const skillGaps: SkillGap[] = role.requirements.map((req) => {
    const userScore = ratings[req.technology_id] ?? 0;
    const gap = Math.max(0, req.required_score - userScore);
    const status = userScore === 0 ? "missing" : userScore >= req.required_score ? "met" : "below";
    return {
      technologyName: req.technologies.name,
      technologyId: req.technology_id,
      requiredScore: req.required_score,
      userScore,
      gap,
      status,
    };
  });

  const totalRatio = skillGaps.reduce((sum, sg) => {
    return sum + Math.min(1, sg.userScore / sg.requiredScore);
  }, 0);
  const matchScore = skillGaps.length > 0 ? Math.round((totalRatio / skillGaps.length) * 100) : 0;

  const missingSkills = skillGaps.filter((sg) => sg.status === "missing");
  const belowSkills = skillGaps.filter((sg) => sg.status === "below");
  const recommendations = [...skillGaps]
    .filter((sg) => sg.status !== "met")
    .sort((a, b) => b.gap - a.gap);

  return {
    role,
    matchScore,
    skillGaps,
    missingSkills,
    belowSkills,
    recommendations,
  };
}

function getMatchColor(score: number): string {
  if (score >= 80) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.danger;
}

export default function RolesScreen() {
  const insets = useSafeAreaInsets();
  const [roles, setRoles] = useState<Role[]>([]);
  const [matches, setMatches] = useState<Record<string, MatchResult>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/(auth)/login"); return; }

    const { data: rolesData, error: rolesErr } = await getRoles();
    if (rolesErr) { setError(rolesErr.message); setLoading(false); setRefreshing(false); return; }

    const { data: techData } = await getTechnologies();
    const { data: ratingData } = await supabase
      .from("user_ratings")
      .select("*")
      .eq("user_id", user.id);

    const ratings: Record<number, number> = {};
    if (ratingData) {
      for (const r of ratingData) {
        ratings[r.technology_id] = r.rating;
      }
    }

    setRoles(rolesData ?? []);

    const matchMap: Record<string, MatchResult> = {};
    if (rolesData && techData) {
      for (const role of rolesData) {
        const { data: roleData } = await supabase
          .from("roles")
          .select("*, requirements:role_requirements(*, technologies(*))")
          .eq("id", role.id)
          .single();
        if (roleData) {
          matchMap[role.id] = calculateMatch(roleData as RoleWithRequirements, ratings);
        }
      }
    }
    setMatches(matchMap);
    setLoading(false);
    setRefreshing(false);
  }

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

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

  const sortedRoles = [...roles].sort((a, b) => {
    const aMatch = matches[a.id];
    const bMatch = matches[b.id];
    return (bMatch?.matchScore ?? 0) - (aMatch?.matchScore ?? 0);
  });

  return (
    <View style={[common.safe, { paddingTop: insets.top }]}>
      <View style={common.header}>
        <Text style={common.headerTitle}>Role Match</Text>
        <Text style={common.headerSubtitle}>
          Find your best-fit role based on your current skills
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.card}
          />
        }
      >
        {sortedRoles.map((role) => {
          const match = matches[role.id];
          const score = match?.matchScore ?? 0;
          const scoreColor = getMatchColor(score);
          const gapCount = (match?.missingSkills.length ?? 0) + (match?.belowSkills.length ?? 0);

          return (
            <TouchableOpacity
              key={role.id}
              style={styles.roleCard}
              onPress={() => router.push(`/roles/${role.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.roleTop}>
                <View style={styles.roleInfo}>
                  <Text style={styles.roleTitle}>{role.title}</Text>
                  <Text style={styles.roleDesc} numberOfLines={2}>
                    {role.description}
                  </Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: scoreColor + "1A" }]}>
                  <Text style={[styles.scoreValue, { color: scoreColor }]}>{score}%</Text>
                  <Text style={styles.scoreLabel}>Match</Text>
                </View>
              </View>

              {match && (
                <View style={styles.roleMeta}>
                  <Text style={styles.roleMetaText}>
                    {match.role.requirements.length} skills required
                  </Text>
                  {gapCount > 0 && (
                    <Text style={[styles.roleMetaText, { color: colors.warning }]}>
                      {gapCount} gaps
                    </Text>
                  )}
                  {gapCount === 0 && score === 100 && (
                    <Text style={[styles.roleMetaText, { color: colors.success }]}>
                      Fully qualified
                    </Text>
                  )}
                </View>
              )}

              {match && match.recommendations.length > 0 && (
                <View style={styles.topGaps}>
                  {match.recommendations.slice(0, 3).map((sg) => (
                    <View key={sg.technologyName} style={styles.gapChip}>
                      <Text style={styles.gapChipText}>
                        {sg.technologyName} {sg.userScore > 0 ? `(${sg.userScore}→${sg.requiredScore})` : ""}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  roleCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  roleTop: {
    flexDirection: "row",
    gap: spacing.md,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  roleDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  scoreBadge: {
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    minWidth: 64,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  roleMeta: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  roleMetaText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  topGaps: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  gapChip: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gapChipText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "600",
  },
});
