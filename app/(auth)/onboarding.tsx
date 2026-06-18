import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { Select } from "../../src/components/Select";
import { colors, spacing } from "../../src/theme";

const ROLE_OPTIONS = [
  { label: "Student", value: "Student" },
  { label: "Developer", value: "Developer" },
  { label: "Freelancer", value: "Freelancer" },
  { label: "Employee", value: "Employee" },
  { label: "Job Seeker", value: "Job Seeker" },
  { label: "Hobbyist", value: "Hobbyist" },
  { label: "Educator", value: "Educator" },
];

const GOAL_ROLE_OPTIONS = [
  { label: "Frontend Developer", value: "Frontend Developer" },
  { label: "Backend Developer", value: "Backend Developer" },
  { label: "Full Stack Developer", value: "Full Stack Developer" },
  { label: "Mobile Developer", value: "Mobile Developer" },
  { label: "DevOps Engineer", value: "DevOps Engineer" },
  { label: "Data Scientist", value: "Data Scientist" },
  { label: "UI/UX Designer", value: "UI/UX Designer" },
  { label: "Software Engineer", value: "Software Engineer" },
  { label: "Tech Lead", value: "Tech Lead" },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [goalRole, setGoalRole] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter your name");
      return;
    }
    if (!role) {
      Alert.alert("Required", "Please select your current role");
      return;
    }
    if (!goalRole) {
      Alert.alert("Required", "Please select your goal role");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert("Error", "You must be logged in");
      setLoading(false);
      router.replace("/(auth)/login");
      return;
    }

    const { error } = await supabase.from("profiles").insert({
      user_id: user.id,
      name: name.trim(),
      role,
      goal_role: goalRole,
    });

    if (error) {
      Alert.alert("Error", error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.replace("/(tabs)/dashboard");
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>StackRate</Text>
        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.subtitle}>
          Tell us about yourself to personalize your experience
        </Text>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Lawrence Saludes"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoCorrect={false}
        />

        <Select
          label="Current Role *"
          options={ROLE_OPTIONS}
          value={role}
          onSelect={setRole}
          placeholder="Select your role"
        />

        <Select
          label="Goal Role *"
          options={GOAL_ROLE_OPTIONS}
          value={goalRole}
          onSelect={setGoalRole}
          placeholder="Select your goal role"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Complete Setup</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xxl,
  },
  brand: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 28,
    lineHeight: 22,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.card,
    color: colors.textPrimary,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    fontSize: 15,
  },
  button: {
    backgroundColor: colors.accent,
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.sm + 2,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontWeight: "700", fontSize: 16 },
});
