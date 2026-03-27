import api from "./api";

export const listStrokesAlbums = async () => {
  const { data } = await api.get("/admin/strokes/albums");
  return data.items || [];
};

export const createStrokesAlbum = async (payload) => {
  const { data } = await api.post("/admin/strokes/albums", payload);
  return data.item;
};

export const updateStrokesAlbum = async (id, payload) => {
  const { data } = await api.put(`/admin/strokes/albums/${id}`, payload);
  return data.item;
};

export const deleteStrokesAlbum = async (id) => {
  await api.delete(`/admin/strokes/albums/${id}`);
};

export const listStrokesSongs = async () => {
  const { data } = await api.get("/admin/strokes/songs");
  return data.items || [];
};

export const createStrokesSong = async (payload) => {
  const { data } = await api.post("/admin/strokes/songs", payload);
  return data.item;
};

export const updateStrokesSong = async (id, payload) => {
  const { data } = await api.put(`/admin/strokes/songs/${id}`, payload);
  return data.item;
};

export const deleteStrokesSong = async (id) => {
  await api.delete(`/admin/strokes/songs/${id}`);
};
