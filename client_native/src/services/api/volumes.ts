import apiClient from "@/services/api/client";
import type { Volume, VolumePayload } from "@/services/contracts/volumeContract";

export async function fetchVolumes(): Promise<Volume[]> {
  const res = await apiClient.get("/admin/volumes");
  return res.data.data;
}

export async function fetchVolume(id: string): Promise<Volume> {
  const res = await apiClient.get(`/admin/volumes/${id}`);
  return res.data.data;
}

export async function createVolume(payload: VolumePayload): Promise<Volume> {
  const res = await apiClient.post("/admin/volumes", payload);
  return res.data.data;
}

export async function updateVolume(id: string, payload: VolumePayload): Promise<Volume> {
  const res = await apiClient.put(`/admin/volumes/${id}`, payload);
  return res.data.data;
}

export async function deleteVolume(id: string): Promise<void> {
  await apiClient.delete(`/admin/volumes/${id}`);
}
