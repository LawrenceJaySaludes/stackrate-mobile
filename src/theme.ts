import { Platform, StyleSheet } from "react-native";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const colors = {
  bg: "#0B1121",
  card: "#121B2E",
  cardBorder: "rgba(99, 102, 241, 0.08)",
  cardBorderHover: "rgba(99, 102, 241, 0.2)",
  accent: "#6366F1",
  accentLight: "rgba(99, 102, 241, 0.1)",
  accentMuted: "rgba(99, 102, 241, 0.15)",
  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#475569",
  success: "#22C55E",
  warning: "#F59E0B",
  info: "#3B82F6",
  danger: "#EF4444",
  dangerLight: "rgba(239, 68, 68, 0.1)",
  white: "#FFFFFF",
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.5, color: colors.textPrimary },
  h2: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.3, color: colors.textPrimary },
  h3: { fontSize: 18, fontWeight: "700" as const, color: colors.textPrimary },
  body: { fontSize: 15, color: colors.textPrimary },
  caption: { fontSize: 13, color: colors.textSecondary },
  small: { fontSize: 11, fontWeight: "600" as const, color: colors.textMuted, textTransform: "uppercase" as const, letterSpacing: 1 },
  label: { fontSize: 13, fontWeight: "600" as const, color: "#94A3B8", marginBottom: 6 },
} as const;

export const common = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 8 : spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  input: {
    backgroundColor: colors.card,
    color: colors.textPrimary,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    fontSize: 15,
  },
  pill: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pillText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
  },
  sectionHeaderText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  sectionBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionBadgeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: colors.white,
    fontWeight: "700",
  },
  label: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600" as const,
    marginBottom: 6,
  },
  errorText: {
    color: colors.danger,
    fontSize: 15,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
});
