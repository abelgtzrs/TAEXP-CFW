import api from "../../services/api";

// The list leaves out rawPastedText to keep it small; use fetchVolume for the full record before editing.
export const fetchVolumes = async () => {
  const response = await api.get("/admin/volumes");
  return response.data.data;
};

export const fetchVolume = async (id) => {
  const response = await api.get(`/admin/volumes/${id}`);
  return response.data.data;
};

// Create and update resolve to the saved volume so callers can update their list without refetching.
export const createVolume = async (payload) => {
  const response = await api.post("/admin/volumes", payload);
  return response.data.data;
};

export const updateVolume = async (id, payload) => {
  const response = await api.put(`/admin/volumes/${id}`, payload);
  return response.data.data;
};

export const deleteVolume = async (id) => {
  await api.delete(`/admin/volumes/${id}`);
};
