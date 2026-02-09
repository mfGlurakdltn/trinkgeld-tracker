import { supabase } from '@/lib/supabase';
import type { ShiftExtended, ShiftInput } from '@/types';

export async function getShifts(): Promise<ShiftExtended[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('shifts_extended')
    .select('*')
    .eq('user_id', user.id)
    .order('datum', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addShift(shift: ShiftInput): Promise<ShiftExtended> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('shifts')
    .insert({ ...shift, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateShift(id: string, updates: Partial<ShiftInput>): Promise<ShiftExtended> {
  const { data, error } = await supabase
    .from('shifts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteShift(id: string): Promise<void> {
  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
