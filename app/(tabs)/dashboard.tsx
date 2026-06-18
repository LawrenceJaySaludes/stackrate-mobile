import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { Profile } from "../../src/types/profile";
import { signOut } from "../../src/services/authService";
import { colors, spacing, common } from "../../src/theme";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ratingStats, setRatingStats] = useState({ rated: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/(auth)/login"); return; }

    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    setProfile(prof);

    const { count: techCount } = await supabase
      .from("technologies")
      .select("*", { count: "exact", head: true });

    const { count: ratedCount } = await supabase
      .from("user_ratings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    setRatingStats({ rated: ratedCount ?? 0, total: techCount ?? 0 });
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
});
