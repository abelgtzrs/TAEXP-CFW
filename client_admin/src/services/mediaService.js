// src/services/mediaService.js
import api from "./api";

export const searchMovies = async (query, page = 1) => {
  const { data } = await api.get("/media/search/movies", { params: { query, page } });
  return { results: data.data, page: data.page, hasMore: data.hasMore };
};

export const searchGames = async (query, page = 1) => {
  const { data } = await api.get("/media/search/games", { params: { query, page } });
  return { results: data.data, page: data.page, hasMore: data.hasMore };
};

export const fetchMediaItems = async (mediaType) => {
  const { data } = await api.get("/media", { params: mediaType ? { mediaType } : {} });
  return data.data;
};

export const addMediaItem = async (payload) => {
  const { data } = await api.post("/media", payload);
  return data.data;
};

export const updateMediaItem = async (id, payload) => {
  const { data } = await api.put(`/media/${id}`, payload);
  return data.data;
};

export const deleteMediaItem = async (id) => {
  await api.delete(`/media/${id}`);
};
