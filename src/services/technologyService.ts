import { supabase } from "../lib/supabase";
import { Category, Technology, TechnologyWithCategory, Role, RoleWithRequirements } from "../types/technology";

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return { data: data as Category[] | null, error };
}

export async function getTechnologies() {
  const { data, error } = await supabase
    .from("technologies")
    .select("*, categories(*)")
    .order("name");

  return { data: data as TechnologyWithCategory[] | null, error };
}

export async function getTechnologyById(id: number) {
  const { data, error } = await supabase
    .from("technologies")
    .select("*, categories(*)")
    .eq("id", id)
    .single();

  return { data: data as TechnologyWithCategory | null, error };
}

export async function getRoles() {
  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .order("title");

  return { data: data as Role[] | null, error };
}

export async function getRoleById(id: string) {
  const { data, error } = await supabase
    .from("roles")
    .select("*, requirements:role_requirements(*, technologies(*))")
    .eq("id", id)
    .single();

  return { data: data as RoleWithRequirements | null, error };
}

export async function getNotes(userId: string, technologyId: number) {
  const { data, error } = await supabase
    .from("user_technology_notes")
    .select("notes")
    .eq("user_id", userId)
    .eq("technology_id", technologyId)
    .maybeSingle();

  return { data: data as { notes: string } | null, error };
}

export async function saveNotes(userId: string, technologyId: number, notes: string) {
  const { data, error } = await supabase
    .from("user_technology_notes")
    .upsert(
      { user_id: userId, technology_id: technologyId, notes },
      { onConflict: "user_id,technology_id" }
    )
    .select()
    .single();

  return { data, error };
}
