import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as volumeApi from "@/services/api/volumes";
import type { VolumePayload } from "@/services/contracts/volumeContract";

const VOLUMES_KEY = ["volumes"];

export function useVolumes() {
  return useQuery({
    queryKey: VOLUMES_KEY,
    queryFn: volumeApi.fetchVolumes,
    staleTime: 1000 * 60 * 5,
  });
}

// The list leaves out rawPastedText; editors load the full record with this.
export function useVolume(id: string | undefined) {
  return useQuery({
    queryKey: [...VOLUMES_KEY, id],
    queryFn: () => volumeApi.fetchVolume(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateVolume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VolumePayload) => volumeApi.createVolume(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: VOLUMES_KEY }),
  });
}

export function useUpdateVolume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VolumePayload }) => volumeApi.updateVolume(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: VOLUMES_KEY }),
  });
}

export function useDeleteVolume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => volumeApi.deleteVolume(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: VOLUMES_KEY }),
  });
}
