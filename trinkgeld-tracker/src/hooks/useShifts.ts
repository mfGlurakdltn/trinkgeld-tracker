import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getShifts, addShift, updateShift, deleteShift } from '@/services/shiftService';
import type { ShiftInput } from '@/types';
import { toast } from 'sonner';

export function useShifts() {
  return useQuery({
    queryKey: ['shifts'],
    queryFn: getShifts,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useAddShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shift: ShiftInput) => addShift(shift),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Schicht gespeichert!');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ShiftInput> }) =>
      updateShift(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Schicht aktualisiert!');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Schicht gelöscht');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}
