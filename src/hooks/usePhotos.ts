import { useCallback, useMemo, useState } from "react";
import { deletePhoto, listAlbums, listPhotos } from "../services/photoService";
import type { PhotoRecord } from "../types";

export type PhotoSortMode = "new" | "old" | "name_asc" | "date_desc";

function sortPhotos(rows: PhotoRecord[], sortMode: PhotoSortMode) {
  const sorted = [...rows];
  const compareText = (a: string, b: string) => a.localeCompare(b, "ko", { sensitivity: "base" });

  if (sortMode === "old") sorted.sort((a, b) => a.createdAt - b.createdAt);
  else if (sortMode === "name_asc") sorted.sort((a, b) => compareText(a.name, b.name) || b.createdAt - a.createdAt);
  else if (sortMode === "date_desc") sorted.sort((a, b) => (b.date ?? b.createdAt) - (a.date ?? a.createdAt));
  else sorted.sort((a, b) => b.createdAt - a.createdAt);

  return sorted;
}

export function usePhotos(roomId: string | null, pageSize = 12) {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [albums, setAlbums] = useState<string[]>([]);
  const [album, setAlbum] = useState("__ALL__");
  const [sortMode, setSortMode] = useState<PhotoSortMode>("new");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sortedPhotos = useMemo(() => sortPhotos(photos, sortMode), [photos, sortMode]);
  const visiblePhotos = useMemo(() => sortedPhotos.slice(0, page * pageSize), [page, pageSize, sortedPhotos]);

  const reload = useCallback(async (nextAlbum = album) => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      const [nextPhotos, nextAlbums] = await Promise.all([listPhotos(roomId, nextAlbum), listAlbums(roomId)]);
      setPhotos(nextPhotos);
      setAlbums(nextAlbums);
      setAlbum(nextAlbum);
      setPage(1);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setLoading(false);
    }
  }, [album, roomId]);

  const removePhoto = useCallback(async (photoId: string) => {
    if (!roomId) return;
    await deletePhoto(roomId, photoId);
    await reload(album);
  }, [album, reload, roomId]);

  return {
    photos,
    visiblePhotos,
    albums,
    album,
    sortMode,
    page,
    loading,
    error,
    hasMore: visiblePhotos.length < sortedPhotos.length,
    setAlbum,
    setSortMode,
    setPage,
    reload,
    removePhoto,
  };
}
