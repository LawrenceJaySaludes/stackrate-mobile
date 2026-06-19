import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { getRoleById } from "../../src/services/technologyService";
import { RoleWithRequirements, SkillGap, MatchResult } from "../../src/types/technology";
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

function getStatusIcon(status: "missing" | "below" | "met"): string {
  switch (status) {
    case "met": return "✓";
    case "below": return "△";
    case "missing": return "✗";
  }
}

function getStatusColor(status: "missing" | "below" | "met"): string {
  switch (status) {
    case "met": return colors.success;
    case "below": return colors.warning;
    case "missing": return colors.danger;
  }
}

function ScoreRing({ score, size }: { score: number; size: number }) {
  const color = getMatchColor(score);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * score) / 100;
  const strokeWidth = 6;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: colors.cardBorder,
          position: "absolute",
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: "transparent",
          borderLeftColor: color,
          borderTopColor: color,
          position: "absolute",
          transform: [{ rotate: "-45deg" }],
        }}
      />
      <Text style={[styles.ringScore, { color }]}>{score}%</Text>
      <Text style={styles.ringLabel}>Match</Text>
    </View>
  );
}

export default function RoleDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [role, setRole] = useState<RoleWithRequirements | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    if (!id) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { data: roleData, error: roleErr } = await getRoleById(id);
    if (roleErr) { setError(roleErr.message); setLoading(false); return; }
    if (!roleData) { setError("Role not found"); setLoading(false); return; }

    setRole(roleData);

    const ratings: Record<number, number> = {};
    if (user) {
      const { data: ratingData } = await supabase
        .from("user_ratings")
        .select("*")
        .eq("user_id", user.id);
      if (ratingData) {
        for (const r of ratingData) {
          ratings[r.technology_id] = r.rating;
        }
      }
    }

    setMatch(calculateMatch(roleData, ratings));
    setLoading(false);
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

  if (error || !role || !match) {
    return (
      <View style={[common.safe, { paddingTop: insets.top }]}>
        <View style={common.center}>
          <Text style={[common.errorText, { marginBottom: spacing.lg }]}>
            {error ?? "Role not found"}
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

  const scoreColor = getMatchColor(match.matchScore);
  const metCount = match.skillGaps.filter((sg) => sg.status === "met").length;
  const totalCount = match.skillGaps.length;

  return (
    <View style={[common.safe, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backArrow}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.roleTitle}>{role.title}</Text>
          <Text style={styles.roleDesc}>{role.description}</Text>
        </View>

        <View style={styles.scoreSection}>
          <ScoreRing score={match.matchScore} size={120} />
          <View style={styles.scoreMeta}>
            <View style={styles.scoreMetaRow}>
              <Text style={styles.scoreMetaValue}>{metCount}/{totalCount}</Text>
              <Text style={styles.scoreMetaLabel}>Skills met</Text>
            </View>
            <View style={styles.scoreMetaRow}>
              <Text style={[styles.scoreMetaValue, { color: colors.warning }]}>
                {match.belowSkills.length}
              </Text>
              <Text style={styles.scoreMetaLabel}>Below par</Text>
            </View>
            <View style={styles.scoreMetaRow}>
              <Text style={[styles.scoreMetaValue, { color: colors.danger }]}>
                {match.missingSkills.length}
              </Text>
              <Text style={styles.scoreMetaLabel}>Missing</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Required Skills</Text>
          {match.skillGaps.map((sg) => {
            const statusColor = getStatusColor(sg.status);
            return (
              <View key={sg.technologyName} style={styles.skillRow}>
                <View style={styles.skillLeft}>
                  <Text style={styles.skillStatusIcon}>
                    {getStatusIcon(sg.status)}
                  </Text>
                  <View>
                    <Text style={styles.skillName}>{sg.technologyName}</Text>
                    {sg.status === "below" && (
                      <Text style={styles.skillDetail}>
                        Your score: {sg.userScore} (needs {sg.requiredScore})
                      </Text>
                    )}
                    {sg.status === "missing" && (
                      <Text style={styles.skillDetail}>
                        Not rated (needs {sg.requiredScore})
                      </Text>
                    )}
                    {sg.status === "met" && (
                      <Text style={[styles.skillDetail, { color: colors.success }]}>
                        Your score: {sg.userScore}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.skillStatusText, { color: statusColor }]}>
                  {sg.status === "met" ? "Met" : `${sg.requiredScore}`}
                </Text>
              </View>
            );
          })}
        </View>

        {match.recommendations.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recommended Next Skills</Text>
            <Text style={styles.sectionSubtitle}>
              Focus on these skills to improve your match score
            </Text>
            {match.recommendations.map((sg, i) => {
              const impact = Math.round(
                ((sg.gap / sg.requiredScore) * 100) / match.skillGaps.length
              );
              return (
                <View key={sg.technologyName} style={styles.recRow}>
                  <View style={styles.recNum}>
                    <Text style={styles.recNumText}>{i + 1}</Text>
                  </View>
                  <View style={styles.recInfo}>
                    <Text style={styles.recName}>{sg.technologyName}</Text>
                    <Text style={styles.recGap}>
                      Gap: {sg.userScore} → {sg.requiredScore} ({sg.gap} pts)
                    </Text>
                  </View>
                  <View style={styles.recImpact}>
                    <Text style={styles.recImpactValue}>+{impact}%</Text>
                    <Text style={styles.recImpactLabel}>impact</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {match.missingSkills.length === 0 && match.belowSkills.length === 0 && (
          <View style={styles.perfectCard}>
            <Text style={styles.perfectIcon}>★</Text>
            <Text style={styles.perfectTitle}>Perfect Match!</Text>
            <Text style={styles.perfectDesc}>
              You meet all the requirements for this role.
            </Text>
          </View>
        )}
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
    marginBottom: spacing.xl,
  },
  roleTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  roleDesc: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxl,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  ringScore: {
    fontSize: 28,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  ringLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: -2,
  },
  scoreMeta: {
    flex: 1,
    gap: spacing.sm,
  },
  scoreMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  scoreMetaValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    width: 28,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  scoreMetaLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.lg,
  },
  skillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  skillLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  skillStatusIcon: {
    fontSize: 16,
    width: 20,
    textAlign: "center",
  },
  skillName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  skillDetail: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  skillStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  recRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  recNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  recNumText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  recInfo: {
    flex: 1,
  },
  recName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  recGap: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  recImpact: {
    alignItems: "center",
  },
  recImpactValue: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  recImpactLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  perfectCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.xxl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.success + "33",
  },
  perfectIcon: {
    fontSize: 40,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  perfectTitle: {
    color: colors.success,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  perfectDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
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
});
