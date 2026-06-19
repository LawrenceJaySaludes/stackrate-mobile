import { useEffect, useState } from "react";
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
import { Profile } from "../../src/types/profile";
import { updateProfile } from "../../src/services/profileService";
import { Select } from "../../src/components/Select";
import { colors, spacing, common } from "../../src/theme";
import StackRateLogo from "../../src/components/StackRateLogo";

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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [goalRole, setGoalRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/(auth)/login"); return; }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProfile(data);
      setName(data.name);
      setRole(data.role);
      setGoalRole(data.goal_role);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert("Required", "Name cannot be empty"); return; }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); router.replace("/(auth)/login"); return; }

    const { error } = await updateProfile(user.id, {
      name: name.trim(),
      role,
      goal_role: goalRole,
    });

    setSaving(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Saved", "Your profile has been updated.");
    }
  }

  if (loading) {
    return (
      <View style={common.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={common.safe}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <StackRateLogo size={56} />
        </View>

        <Text style={common.headerTitle}>Profile</Text>
        <Text style={common.headerSubtitle}>Edit your personal information</Text>

        <Text style={common.label}>Full Name</Text>
        <TextInput
          style={common.input}
          placeholder="Your name"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Select
          label="Current Role"
          options={ROLE_OPTIONS}
          value={role}
          onSelect={setRole}
          placeholder="Select your role"
        />

        <Select
          label="Goal Role"
          options={GOAL_ROLE_OPTIONS}
          value={goalRole}
          onSelect={setGoalRole}
          placeholder="Select your goal role"
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using this app you agree to our Terms of Service and Privacy Policy.
          </Text>
          <Text style={styles.copyright}>
            © {new Date().getFullYear()} Lawrence Saludes. All Rights Reserved.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  footer: {
    marginTop: spacing.xxxl,
    paddingTop: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    alignItems: "center",
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  copyright: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: colors.accent,
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.sm,
    alignItems: "center",
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: colors.white, fontWeight: "700", fontSize: 16 },
});
