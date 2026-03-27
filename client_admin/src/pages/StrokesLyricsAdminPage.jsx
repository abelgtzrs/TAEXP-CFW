import { useEffect, useMemo, useState } from "react";
import { Music, Plus, Pencil, Trash2, X, Save, RefreshCw, Disc3, ArrowUp, ArrowDown } from "lucide-react";
import {
  createStrokesAlbum,
  createStrokesSong,
  deleteStrokesAlbum,
  deleteStrokesSong,
  listStrokesAlbums,
  listStrokesSongs,
  updateStrokesAlbum,
  updateStrokesSong,
} from "../services/strokesAdminService";

const emptySongForm = {
  title: "",
  album: "",
  lyrics: [""],
};

const emptyAlbumForm = {
  name: "",
  year: "",
  coverImageUrl: "",
};

const formatAlbumLabel = (album) => {
  if (!album) return "Unknown album";
  const year = Number.isFinite(Number(album.year)) ? ` (${album.year})` : "";
  return `${album.name || "Untitled"}${year}`;
};

const normalizeQuery = (value) =>
  String(value || "")
    .toLowerCase()
    .trim();

const toEscapedNewlines = (value) =>
  String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n/g, "\\n");

const controlClass =
  "w-full rounded-lg border border-gray-700 bg-[#0b0f14] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/60";

export default function StrokesLyricsAdminPage() {
  const [albums, setAlbums] = useState([]);
  const [songs, setSongs] = useState([]);
  const [songForm, setSongForm] = useState(emptySongForm);
  const [albumForm, setAlbumForm] = useState(emptyAlbumForm);
  const [editingSongId, setEditingSongId] = useState(null);
  const [editingAlbumId, setEditingAlbumId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSong, setSavingSong] = useState(false);
  const [savingAlbum, setSavingAlbum] = useState(false);
  const [error, setError] = useState("");
  const [songSearch, setSongSearch] = useState("");
  const [albumSearch, setAlbumSearch] = useState("");

  const albumOptions = useMemo(
    () =>
      [...albums].sort(
        (a, b) =>
          Number(a?.year || 0) - Number(b?.year || 0) || String(a?.name || "").localeCompare(String(b?.name || "")),
      ),
    [albums],
  );

  const filteredSongs = useMemo(() => {
    const q = normalizeQuery(songSearch);
    if (!q) return songs;

    return songs.filter((song) => {
      const fields = [song?.title, song?.album?.name, ...(song?.lyrics || [])].map((field) => normalizeQuery(field));
      return fields.some((field) => field.includes(q));
    });
  }, [songs, songSearch]);

  const filteredAlbums = useMemo(() => {
    const q = normalizeQuery(albumSearch);
    if (!q) return albumOptions;
    return albumOptions.filter((album) => {
      const fields = [album?.name, album?.year, album?.coverImageUrl].map((field) => normalizeQuery(field));
      return fields.some((field) => field.includes(q));
    });
  }, [albumOptions, albumSearch]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [albumList, songList] = await Promise.all([listStrokesAlbums(), listStrokesSongs()]);
      setAlbums(Array.isArray(albumList) ? albumList : []);
      setSongs(Array.isArray(songList) ? songList : []);

      if (!editingSongId && albumList?.length) {
        setSongForm((prev) => ({
          ...prev,
          album: prev.album || albumList[0]._id,
        }));
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load Strokes lyrics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetSongForm = () => {
    setEditingSongId(null);
    setSongForm({
      ...emptySongForm,
      album: albumOptions[0]?._id || "",
    });
  };

  const resetAlbumForm = () => {
    setEditingAlbumId(null);
    setAlbumForm(emptyAlbumForm);
  };

  const updateLyricLine = (idx, value) => {
    setSongForm((prev) => {
      const nextLyrics = [...prev.lyrics];
      nextLyrics[idx] = value;
      return { ...prev, lyrics: nextLyrics };
    });
  };

  const addLyricLine = () => {
    setSongForm((prev) => ({ ...prev, lyrics: [...prev.lyrics, ""] }));
  };

  const removeLyricLine = (idx) => {
    setSongForm((prev) => {
      const nextLyrics = prev.lyrics.filter((_, index) => index !== idx);
      return { ...prev, lyrics: nextLyrics.length ? nextLyrics : [""] };
    });
  };

  const moveLyricLine = (idx, direction) => {
    setSongForm((prev) => {
      const nextIdx = idx + direction;
      if (nextIdx < 0 || nextIdx >= prev.lyrics.length) return prev;
      const nextLyrics = [...prev.lyrics];
      const current = nextLyrics[idx];
      nextLyrics[idx] = nextLyrics[nextIdx];
      nextLyrics[nextIdx] = current;
      return { ...prev, lyrics: nextLyrics };
    });
  };

  const submitSong = async (event) => {
    event.preventDefault();
    setSavingSong(true);
    setError("");

    try {
      const title = songForm.title.trim();
      const album = songForm.album;
      const lyrics = (songForm.lyrics || []).map((line) => String(line || "").trim()).filter(Boolean);

      if (!title) throw new Error("Song title is required.");
      if (!album) throw new Error("Album is required.");

      const payload = { title, album, lyrics };

      if (editingSongId) {
        await updateStrokesSong(editingSongId, payload);
      } else {
        await createStrokesSong(payload);
      }

      resetSongForm();
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to save song lyrics.");
    } finally {
      setSavingSong(false);
    }
  };

  const submitAlbum = async (event) => {
    event.preventDefault();
    setSavingAlbum(true);
    setError("");

    try {
      const name = albumForm.name.trim();
      const year = Number(albumForm.year);
      const coverImageUrl = albumForm.coverImageUrl.trim();

      if (!name) throw new Error("Album name is required.");
      if (!Number.isFinite(year)) throw new Error("Album year is required.");
      if (!coverImageUrl) throw new Error("Album cover URL is required.");

      const payload = { name, year, coverImageUrl };
      if (editingAlbumId) {
        await updateStrokesAlbum(editingAlbumId, payload);
      } else {
        await createStrokesAlbum(payload);
      }

      resetAlbumForm();
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to save album.");
    } finally {
      setSavingAlbum(false);
    }
  };

  const startEdit = (song) => {
    setEditingSongId(song._id);
    setError("");
    setSongForm({
      title: song?.title || "",
      album: song?.album?._id || "",
      lyrics: (song?.lyrics || []).length ? [...song.lyrics] : [""],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startAlbumEdit = (album) => {
    setEditingAlbumId(album._id);
    setError("");
    setAlbumForm({
      name: album?.name || "",
      year: String(album?.year || ""),
      coverImageUrl: album?.coverImageUrl || "",
    });
  };

  const removeSong = async (song) => {
    if (!window.confirm(`Delete \"${song?.title || "this song"}\"?`)) return;

    try {
      await deleteStrokesSong(song._id);
      if (editingSongId === song._id) resetSongForm();
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete song.");
    }
  };

  const removeAlbum = async (album) => {
    if (!window.confirm(`Delete album \"${album?.name || "this album"}\"?`)) return;

    try {
      await deleteStrokesAlbum(album._id);
      if (editingAlbumId === album._id) resetAlbumForm();
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete album.");
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Music size={20} className="text-primary" />
            Strokes Lyrics Manager
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Add, edit, and delete songs and lyric lines used by the Strokes widget.
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 bg-surface/70 hover:bg-surface text-text-secondary hover:text-white transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
      )}

      <form onSubmit={submitSong} className="rounded-xl border border-gray-700/60 bg-surface/70 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">{editingSongId ? "Edit Song" : "Add Song"}</h2>
          {editingSongId && (
            <button
              type="button"
              onClick={resetSongForm}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md border border-gray-700 hover:border-gray-500 text-text-secondary hover:text-white"
            >
              <X size={14} />
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-text-tertiary">Song Title</span>
            <input
              value={songForm.title}
              onChange={(e) => setSongForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Reptilia"
              className={controlClass}
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-text-tertiary">Album</span>
            <select
              value={songForm.album}
              onChange={(e) => setSongForm((prev) => ({ ...prev, album: e.target.value }))}
              className={controlClass}
              style={{ backgroundColor: "#0b0f14" }}
              required
            >
              <option value="">Select album...</option>
              {albumOptions.map((album) => (
                <option key={album._id} value={album._id}>
                  {formatAlbumLabel(album)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-text-tertiary">Lyrics (edit each line directly)</span>
            <button
              type="button"
              onClick={addLyricLine}
              className="inline-flex items-center gap-1 rounded-md border border-gray-700 px-2 py-1 text-xs text-text-secondary hover:text-white hover:border-gray-500"
            >
              <Plus size={12} />
              Add Line
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {songForm.lyrics.map((line, idx) => (
              <div key={`line-${idx}`} className="flex gap-2 items-start">
                <span className="text-xs text-text-tertiary w-6 text-right pt-2">{idx + 1}</span>
                <textarea
                  value={line}
                  onChange={(e) => updateLyricLine(idx, e.target.value)}
                  placeholder="Type lyric entry (Shift+Enter/new line supported)"
                  className={controlClass}
                  rows={3}
                />
                <button
                  type="button"
                  onClick={() => moveLyricLine(idx, -1)}
                  className="rounded-md border border-gray-700 p-2 text-text-secondary hover:text-white disabled:opacity-40"
                  disabled={idx === 0}
                  title="Move up"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveLyricLine(idx, 1)}
                  className="rounded-md border border-gray-700 p-2 text-text-secondary hover:text-white disabled:opacity-40"
                  disabled={idx === songForm.lyrics.length - 1}
                  title="Move down"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => removeLyricLine(idx)}
                  className="rounded-md border border-red-700/70 p-2 text-red-300 hover:bg-red-600/20"
                  title="Remove line"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-gray-700/80 bg-[#05080d] p-3">
            <div className="text-[11px] uppercase tracking-wide text-text-tertiary mb-2">
              Array Entry Preview (Actual lyrics[])
            </div>
            <div className="space-y-1 font-mono text-xs">
              {songForm.lyrics.map((line, idx) => (
                <div key={`break-preview-${idx}`} className="flex items-start gap-2">
                  <span className="text-gray-500 w-6 text-right">{idx + 1}</span>
                  <span className={line.trim() ? "text-gray-200 break-all" : "text-gray-500 italic"}>
                    {line ? `"${toEscapedNewlines(line)}"` : '"[empty string]"'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={savingSong}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:opacity-90 text-white transition-opacity disabled:opacity-60"
        >
          {editingSongId ? <Save size={14} /> : <Plus size={14} />}
          {savingSong ? "Saving..." : editingSongId ? "Update Song" : "Create Song"}
        </button>
      </form>

      <div className="rounded-xl border border-gray-700/60 bg-surface/70 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <Disc3 size={18} className="text-primary" />
            Album Manager
          </h2>
          {editingAlbumId && (
            <button
              type="button"
              onClick={resetAlbumForm}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md border border-gray-700 hover:border-gray-500 text-text-secondary hover:text-white"
            >
              <X size={14} />
              Cancel Album Edit
            </button>
          )}
        </div>

        <form onSubmit={submitAlbum} className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-end">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-text-tertiary">Album Name</span>
            <input
              value={albumForm.name}
              onChange={(e) => setAlbumForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Is This It"
              className={controlClass}
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-text-tertiary">Year</span>
            <input
              type="number"
              min="1900"
              max="3000"
              value={albumForm.year}
              onChange={(e) => setAlbumForm((prev) => ({ ...prev, year: e.target.value }))}
              placeholder="2001"
              className={controlClass}
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-text-tertiary">Cover Image URL</span>
            <input
              value={albumForm.coverImageUrl}
              onChange={(e) => setAlbumForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
              placeholder="https://..."
              className={controlClass}
              required
            />
          </label>

          <div className="lg:col-span-3">
            <button
              type="submit"
              disabled={savingAlbum}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:opacity-90 text-white transition-opacity disabled:opacity-60"
            >
              {editingAlbumId ? <Save size={14} /> : <Plus size={14} />}
              {savingAlbum ? "Saving..." : editingAlbumId ? "Update Album" : "Create Album"}
            </button>
          </div>
        </form>

        <div className="flex flex-wrap justify-between gap-3 items-center">
          <h3 className="text-base font-medium text-white">Existing Albums</h3>
          <input
            value={albumSearch}
            onChange={(e) => setAlbumSearch(e.target.value)}
            placeholder="Search albums..."
            className={`${controlClass} w-full md:w-80`}
          />
        </div>

        {loading ? (
          <div className="text-sm text-text-secondary">Loading albums...</div>
        ) : filteredAlbums.length === 0 ? (
          <div className="text-sm text-text-secondary">No albums found.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredAlbums.map((album) => (
              <article key={album._id} className="rounded-lg border border-gray-700/70 bg-[#0b0f14] p-3 flex gap-3">
                <img
                  src={album.coverImageUrl}
                  alt={album.name}
                  className="w-14 h-14 rounded-md object-cover border border-gray-700"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-white font-medium truncate">{album.name}</h4>
                      <p className="text-xs text-text-secondary">{album.year}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => startAlbumEdit(album)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-600 px-2 py-1 text-xs text-text-secondary hover:text-white hover:border-gray-400"
                      >
                        <Pencil size={12} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAlbum(album)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-600/70 px-2 py-1 text-xs text-red-300 hover:bg-red-600/20"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-text-tertiary truncate mt-2">{album.coverImageUrl}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-700/60 bg-surface/70 p-4 space-y-3">
        <div className="flex flex-wrap justify-between gap-3 items-center">
          <h2 className="text-lg font-medium text-white">Songs</h2>
          <input
            value={songSearch}
            onChange={(e) => setSongSearch(e.target.value)}
            placeholder="Search songs, albums, or lyrics..."
            className={`${controlClass} w-full md:w-80`}
          />
        </div>

        {loading ? (
          <div className="text-sm text-text-secondary">Loading songs...</div>
        ) : filteredSongs.length === 0 ? (
          <div className="text-sm text-text-secondary">No songs found.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredSongs.map((song) => (
              <article key={song._id} className="rounded-lg border border-gray-700/70 bg-background/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">{song.title}</h3>
                    <p className="text-xs text-primary mt-0.5">{formatAlbumLabel(song.album)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(song)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-600 px-2 py-1 text-xs text-text-secondary hover:text-white hover:border-gray-400"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSong(song)}
                      className="inline-flex items-center gap-1 rounded-md border border-red-600/70 px-2 py-1 text-xs text-red-300 hover:bg-red-600/20"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-xs text-text-secondary">
                  <span className="text-text-tertiary">{song?.lyrics?.length || 0}</span> lyric line
                  {song?.lyrics?.length === 1 ? "" : "s"}
                </div>

                {song?.lyrics?.length > 0 && (
                  <ul className="mt-2 space-y-1 max-h-36 overflow-y-auto pr-1">
                    {song.lyrics.map((line, idx) => (
                      <li
                        key={`${song._id}-${idx}`}
                        className="text-sm text-text-secondary leading-relaxed border-l border-primary/50 pl-2"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
