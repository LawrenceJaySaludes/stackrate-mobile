import { supabase } from "../lib/supabase";
import { Profile } from "../types/profile";

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  return { data: data as Profile | null, error };
}

export async function createProfile(
  userId: string,
  name: string,
  role: string,
  goalRole: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,
      name,
      role,
      goal_role: goalRole,
    })
    .select()
    .single();

  return { data: data as Profile | null, error };
}

export async function updateProfile(
  userId: string,
  updates: { name?: string; role?: string; goal_role?: string }
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  return { data: data as Profile | null, error };
}
