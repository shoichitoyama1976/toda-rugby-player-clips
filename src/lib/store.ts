import { create } from "zustand";
import { persist } from "zustand/middleware";

type ClipState = {
  sheetUrl: string;
  sheetCsv: string | null;
  lastSynced: string | null;
  bookmarks: string[];
  hydrated: boolean;
  setHydrated: () => void;
  setSheet: (url: string, csv: string) => void;
  clearSheet: () => void;
  toggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
};

export const useClipStore = create<ClipState>()(
  persist(
    (set, get) => ({
      sheetUrl: "",
      sheetCsv: null,
      lastSynced: null,
      bookmarks: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      setSheet: (url, csv) =>
        set({ sheetUrl: url, sheetCsv: csv, lastSynced: new Date().toISOString() }),
      clearSheet: () => set({ sheetUrl: "", sheetCsv: null, lastSynced: null }),
      toggleBookmark: (id) => {
        const current = get().bookmarks;
        set({
          bookmarks: current.includes(id)
            ? current.filter((item) => item !== id)
            : [...current, id],
        });
      },
      isBookmarked: (id) => get().bookmarks.includes(id),
    }),
    {
      name: "levins-clip-v1",
      partialize: (state) => ({
        sheetUrl: state.sheetUrl,
        sheetCsv: state.sheetCsv,
        lastSynced: state.lastSynced,
        bookmarks: state.bookmarks,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
