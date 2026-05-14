import { useCallback, useMemo, useState } from "react";
import { assertAdminRole } from "../services/permissionService";
import { deletePhoto, listAlbums, listPhotos, setPhotoAsCover, updatePhoto, uploadPhotoFile, type PhotoUploadProgress } from "../services/photoService";
import type { RoomRole } from "../services/roomService";
import type { PhotoRecord } from "../types";

export type PhotoSortMode = "new" | "old" | "custom";

function sortPhotos(rows: PhotoRecord[], sortMode: PhotoSortMode) {
  const sorted = [...rows];
  const compareText = (a: string, b: string) => a.localeCompare(b, "ko", { sensitivity: "base" });

  if (sortMode === "old") sorted.sort((a, b) => (a.date ?? a.createdAt) - (b.date ?? b.createdAt));
  else if (sortMode === "custom") sorted.sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt) || compareText(a.name, b.name));
  else sorted.sort((a, b) => b.createdAt - a.createdAt);

  return sorted;
}

export function usePhotos(roomId: string | null, pageSize = 18, role: RoomRole | null = "admin") {
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
    assertAdminRole(role);
    await deletePhoto(roomId, photoId);
    await reload(album);
  }, [album, reload, role, roomId]);

  const removePhotos = useCallback(async (photoIds: string[]) => {
    if (!roomId) return;
    assertAdminRole(role);
    for (const photoId of photoIds) {
      await deletePhoto(roomId, photoId);
    }
    await reload(album);
  }, [album, reload, role, roomId]);

  const uploadPhotos = useCallback(async (files: File[], metadata: Pick<PhotoRecord, "album" | "caption" | "date">, onProgress?: (progress: PhotoUploadProgress) => void) => {
    if (!roomId) return;
    assertAdminRole(role);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    for (const [index, file] of imageFiles.entries()) {
      if (!file.type.startsWith("image/")) continue;
      await uploadPhotoFile(roomId, file, metadata, {
        fileIndex: index + 1,
        fileCount: imageFiles.length,
        onProgress,
      });
    }
    await reload(metadata.album || album);
  }, [album, reload, role, roomId]);

  const updatePhotoMeta = useCallback(async (photoId: string, patch: Partial<PhotoRecord>) => {
    if (!roomId) return;
    assertAdminRole(role);
    await updatePhoto(roomId, photoId, patch);
    await reload(album);
  }, [album, reload, role, roomId]);

  const movePhotosToAlbum = useCallback(async (photoIds: string[], nextAlbum: string) => {
    if (!roomId) return;
    assertAdminRole(role);
    await Promise.all(photoIds.map((photoId) => updatePhoto(roomId, photoId, { album: nextAlbum })));
    await reload(album);
  }, [album, reload, role, roomId]);

  const setCoverPhoto = useCallback(async (photoId: string) => {
    if (!roomId) return;
    assertAdminRole(role);
    await setPhotoAsCover(roomId, photoId);
    await reload(album);
  }, [album, reload, role, roomId]);

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
    removePhotos,
    movePhotosToAlbum,
    setCoverPhoto,
    uploadPhotos,
    updatePhotoMeta,
  };
}
