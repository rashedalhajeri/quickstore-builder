
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Section {
  id: string;
  name: string;
  sort_order: number;
  store_id?: string;
  section_type: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const fetchSections = async (storeId: string) => {
  try {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .eq('store_id', storeId)
      .order('sort_order', { ascending: true });
      
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    console.error("Error fetching sections:", err);
    return { data: [], error: err };
  }
};

export const addSection = async (name: string, sectionType: string, storeId: string, sortOrder: number, isActive: boolean = true) => {
  try {
    const { data, error } = await supabase
      .from('sections')
      .insert({
        name: name.trim(),
        store_id: storeId,
        sort_order: sortOrder,
        section_type: sectionType,
        is_active: isActive
      })
      .select()
      .single();
      
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("Error adding section:", err);
    return { data: null, error: err };
  }
};

export const updateSection = async (section: Section, storeId: string) => {
  try {
    const { error } = await supabase
      .from('sections')
      .update({
        name: section.name,
        section_type: section.section_type,
        is_active: section.is_active
      })
      .eq('id', section.id)
      .eq('store_id', storeId);
      
    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error("Error updating section:", err);
    return { error: err };
  }
};

export const deleteSection = async (sectionId: string, storeId: string) => {
  try {
    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', sectionId)
      .eq('store_id', storeId);
      
    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error("Error deleting section:", err);
    return { error: err };
  }
};
