import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { Profile } from "../../src/types/profile";
import { getTechnologies } from "../../src/services/technologyService";
import { TechnologyWithCategory, CategoryScore, AnalyticsData } from "../../src/types/technology";
import { signOut } from "../../src/services/authService";
import { colors, spacing, common } from "../../src/theme";
import RadarChart from "../../src/components/RadarChart";
import StackRateLogo from "../../src/components/StackRateLogo";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ratingStats, setRatingStats] = useState({ rated: 0, total: 0 });
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/(auth)/login"); return; }

    setLoading(true);

    const [{ data: prof }, { data: techData }, { data: ratingData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      getTechnologies(),
      supabase.from("user_ratings").select("*").eq("user_id", user.id),
    ]);
    setProfile(prof);

    const allTech = techData ?? [];
    const allRatings = ratingData ?? [];

    const ratingMap: Record<number, number> = {};
    for (const r of allRatings) {
      ratingMap[r.technology_id] = r.rating;
    }

    const ratedTechs = allTech.filter((t) => (ratingMap[t.id] ?? 0) > 0);
    const totalRated = ratedTechs.length;
    const totalTechs = allTech.length;
    setRatingStats({ rated: totalRated, total: totalTechs });

    const catMap: Record<string, TechnologyWithCategory[]> = {};
    for (const t of allTech) {
      const catName = t.categories?.name ?? "Uncategorized";
      if (!catMap[catName]) catMap[catName] = [];
      catMap[catName].push(t);
    }

    const categoryScores: CategoryScore[] = [];
    for (const [catName, techs] of Object.entries(catMap).sort((a, b) => a[0].localeCompare(b[0]))) {
      const ratedTechsInCat = techs.filter((t) => (ratingMap[t.id] ?? 0) > 0);
      const totalInCat = techs.length;
      const ratedInCat = ratedTechsInCat.length;
      const avg =
        ratedInCat > 0
          ? Math.round(
              ratedTechsInCat.reduce((sum, t) => sum + (ratingMap[t.id] ?? 0), 0) / ratedInCat
            )
          : 0;
      categoryScores.push({
        categoryName: catName,
        average: avg,
        rated: ratedInCat,
        total: totalInCat,
      });
    }

    const overallScore =
      totalRated > 0
        ? Math.round(
            ratedTechs.reduce((sum, t) => sum + (ratingMap[t.id] ?? 0), 0) / totalRated
          )
        : 0;

    setAnalytics({ overallScore, totalRated, totalTechnologies: totalTechs, categoryScores });
    setLoading(false);
    setRefreshing(false);
  }

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  async function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout", style: "destructive",
        onPress: async () => { await signOut(); router.replace("/(auth)/login"); },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={common.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[common.safe, { paddingTop: insets.top }]}
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
      <View style={styles.logoWrap}>
        <StackRateLogo size={56} />
      </View>

      <View style={common.header}>
        <Text style={common.headerTitle}>Dashboard</Text>
      </View>

      {profile ? (
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <View style={styles.roleRow}>
            <View style={common.pill}>
              <Text style={common.pillText}>{profile.role}</Text>
            </View>
            {profile.goal_role ? (
              <View style={styles.goalPill}>
                <Text style={styles.goalPillText}>{profile.goal_role}</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.profileCard}>
          <Text style={styles.noProfile}>Complete your profile to get started</Text>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => router.push("/(auth)/onboarding")}
            activeOpacity={0.8}
          >
            <Text style={styles.completeButtonText}>Set Up Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {analytics && (
        <View style={[common.card, styles.overallCard]}>
          <Text style={styles.infoLabel}>Overall Score</Text>
          <View style={styles.overallScoreRow}>
            <Text style={styles.overallScoreNumber}>{analytics.overallScore}%</Text>
            <Text style={styles.overallScoreSub}>
              {analytics.totalRated} of {analytics.totalTechnologies} technologies rated
            </Text>
          </View>
          {analytics.totalRated > 0 && (
            <View style={styles.overallBar}>
              <View
                style={[
                  styles.overallBarFill,
                  { width: `${Math.max(analytics.overallScore, 4)}%` },
                ]}
              />
            </View>
          )}
        </View>
      )}

      {analytics && analytics.categoryScores.length > 0 && (
        <>
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionLabelText}>Category Scores</Text>
          </View>
          <View style={[common.card, styles.chartCard]}>
            <RadarChart
              data={analytics.categoryScores.map((cs) => ({
                label: cs.categoryName,
                value: cs.average,
              }))}
              size={Math.min(screenWidth - spacing.xl * 4, 280)}
            />
            <View style={styles.catLegend}>
              {analytics.categoryScores.map((cs) => (
                <View key={cs.categoryName} style={styles.catLegendItem}>
                  <Text style={styles.catLegendCat}>{cs.categoryName}</Text>
                  <Text style={styles.catLegendScore}>
                    {cs.average}%
                    <Text style={styles.catLegendCount}>
                      {" "}({cs.rated}/{cs.total})
                    </Text>
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>Your Progress</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{ratingStats.rated}</Text>
          <Text style={styles.statLabel}>Rated</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{ratingStats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {ratingStats.total > 0
              ? Math.round((ratingStats.rated / ratingStats.total) * 100)
              : 0}%
          </Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
      </View>

      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>Quick Access</Text>
      </View>

      <View style={styles.quickLinks}>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => router.push("/(tabs)/library")}
          activeOpacity={0.7}
        >
          <Text style={styles.quickLinkIcon}>▣</Text>
          <Text style={styles.quickLinkText}>Library</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => router.push("/(tabs)/assessment")}
          activeOpacity={0.7}
        >
          <Text style={styles.quickLinkIcon}>◎</Text>
          <Text style={styles.quickLinkText}>Assess</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.7}
        >
          <Text style={styles.quickLinkIcon}>○</Text>
          <Text style={styles.quickLinkText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxxl,
  },
  logoWrap: {
    alignItems: "center",
    paddingTop: spacing.xl,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.xxl,
    alignItems: "center",
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatarText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "800",
  },
  profileName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  roleRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  goalPill: {
    backgroundColor: colors.accentMuted,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  goalPillText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  noProfile: {
    color: colors.textSecondary,
    fontSize: 15,
    marginBottom: spacing.lg,
  },
  completeButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm + 2,
    borderRadius: 10,
  },
  completeButtonText: {
    color: colors.white,
    fontWeight: "700",
  },
  sectionLabel: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm + 2,
  },
  sectionLabelText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 14,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.lg,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.cardBorder,
    alignSelf: "stretch",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  quickLinks: {
    flexDirection: "row",
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  quickLink: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  quickLinkIcon: {
    fontSize: 22,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  quickLinkText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: colors.dangerLight,
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 15,
  },
  overallCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.xl,
  },
  overallScoreRow: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  overallScoreNumber: {
    color: colors.accent,
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1,
  },
  overallScoreSub: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  overallBar: {
    height: 4,
    backgroundColor: colors.cardBorder,
    borderRadius: 2,
    overflow: "hidden",
  },
  overallBarFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  chartCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  catLegend: {
    width: "100%",
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  catLegendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  catLegendCat: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  catLegendScore: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  catLegendCount: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "400",
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
});
