import { AudioHistoryItem } from "../types";

const DB_NAME = "PersianTTS_AudioDB";
const STORE_NAME = "audio_history";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not supported"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Load all stored audio history items
 */
export async function loadStoredAudioHistory(): Promise<AudioHistoryItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = (request.result as AudioHistoryItem[]) || [];
        // Sort descending by id or timestamp
        items.sort((a, b) => Number(b.id) - Number(a.id));
        resolve(items);
      };

      request.onerror = () => {
        // Fallback to localStorage
        resolve(loadFromLocalStorage());
      };
    });
  } catch {
    return loadFromLocalStorage();
  }
}

/**
 * Save an audio history item permanently
 */
export async function saveAudioHistoryItem(item: AudioHistoryItem): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Failed to save audio to IndexedDB, falling back:", err);
    saveToLocalStorage(item);
  }
}

/**
 * Delete a specific audio history item by ID
 */
export async function deleteStoredAudioItem(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // fallback
    const items = loadFromLocalStorage().filter((x) => x.id !== id);
    try {
      localStorage.setItem("persian_tts_history_meta", JSON.stringify(items));
    } catch {}
  }
}

/**
 * Clear all stored audio history
 */
export async function clearAllStoredAudio(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // fallback
  }
  try {
    localStorage.removeItem("persian_tts_history");
    localStorage.removeItem("persian_tts_history_meta");
  } catch {}
}

/* Fallback local storage helpers */
function loadFromLocalStorage(): AudioHistoryItem[] {
  try {
    const saved = localStorage.getItem("persian_tts_history");
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveToLocalStorage(item: AudioHistoryItem) {
  try {
    const items = loadFromLocalStorage();
    const updated = [item, ...items.filter((x) => x.id !== item.id)].slice(0, 10);
    localStorage.setItem("persian_tts_history", JSON.stringify(updated));
  } catch (e) {
    // If quota exceeded, strip raw audio data in local storage
    try {
      const items = loadFromLocalStorage();
      const stripped = [item, ...items].slice(0, 5).map((x) => ({
        ...x,
        audioData: x.audioData.length > 50000 ? "" : x.audioData,
      }));
      localStorage.setItem("persian_tts_history", JSON.stringify(stripped));
    } catch {}
  }
}
