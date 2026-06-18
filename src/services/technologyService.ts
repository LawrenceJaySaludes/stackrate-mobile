import { supabase } from "../lib/supabase";
import { Category, Technology, TechnologyWithCategory } from "../types/technology";

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
