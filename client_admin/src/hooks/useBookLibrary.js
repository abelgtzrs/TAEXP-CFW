import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { emitToast } from "../utils/toastBus";

// Action errors go to a toast so they show above an open sheet.
const notifyError = (message) => emitToast({ title: message, tag: "Reading Log" });

// The signed-in user's books plus the add/progress/finish/remove actions, shared by
// the Reading Log page and the dashboard widget.
export default function useBookLibrary() {
  const { setUser } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/books")
      .then((response) => !cancelled && setBooks(response.data.data || []))
      .catch(() => !cancelled && setLoadError("Couldn't load your library. Refresh the page to try again."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Swap in the saved book; a just-finished book also returns the rewarded user.
  const applyServerBook = (response) => {
    const updatedBook = response.data.data;
    setBooks((prev) => prev.map((b) => (b._id === updatedBook._id ? updatedBook : b)));
    if (response.data.userData) {
      setUser(response.data.userData);
      emitToast({ title: "Book finished", message: response.data.message, tag: "Reading Log" });
    }
  };

  // Resolves true on success so the form knows whether to clear.
  const addBook = async (bookData) => {
    setAdding(true);
    try {
      const response = await api.post("/books", bookData);
      setBooks((prev) => [response.data.data, ...prev]);
      return true;
    } catch (err) {
      notifyError(err.response?.data?.message || "Couldn't add the book. Check the fields and try again.");
      return false;
    } finally {
      setAdding(false);
    }
  };

  // Optimistic: the new page shows at once and is rolled back if the save fails.
  const saveProgress = async (bookId, pagesRead) => {
    const original = books.find((b) => b._id === bookId);
    setBooks((prev) =>
      prev.map((b) => (b._id === bookId ? { ...b, pagesRead, updatedAt: new Date().toISOString() } : b)),
    );
    try {
      applyServerBook(await api.put(`/books/${bookId}`, { pagesRead }));
    } catch {
      setBooks((prev) => prev.map((b) => (b._id === bookId && original ? original : b)));
      notifyError("Couldn't save your progress. Check your connection and try again.");
    }
  };

  const finishBook = async (bookId) => {
    try {
      applyServerBook(await api.put(`/books/${bookId}`, { isFinished: true, finishedDate: new Date().toISOString() }));
    } catch {
      notifyError("Couldn't mark the book as finished. Try again.");
    }
  };

  const deleteBook = async (bookId) => {
    const book = books.find((b) => b._id === bookId);
    if (!window.confirm(`Remove "${book?.title || "this book"}" from your library?`)) return;
    try {
      await api.delete(`/books/${bookId}`);
      setBooks((prev) => prev.filter((b) => b._id !== bookId));
    } catch {
      notifyError("Couldn't remove the book. Try again.");
    }
  };

  return { books, loading, loadError, adding, addBook, saveProgress, finishBook, deleteBook };
}
