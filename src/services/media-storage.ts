import * as FileSystem from 'expo-file-system/legacy';

export type ManagedMedia = {
  uri: string;
  storageKey: string;
};

const ROOT_DIRECTORY = `${FileSystem.documentDirectory ?? ''}battlereef-media`;

function extensionFromUri(uri: string) {
  const clean = uri.split('?')[0] ?? uri;
  const match = clean.match(/\.([a-zA-Z0-9]{2,5})$/);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}

export async function importPhotoToManagedStorage(sourceUri: string): Promise<ManagedMedia> {
  if (!FileSystem.documentDirectory) {
    throw new Error('Managed media storage is unavailable on this platform.');
  }

  await FileSystem.makeDirectoryAsync(ROOT_DIRECTORY, { intermediates: true });

  const storageKey = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${extensionFromUri(sourceUri)}`;
  const destination = `${ROOT_DIRECTORY}/${storageKey}`;

  await FileSystem.copyAsync({ from: sourceUri, to: destination });

  return { uri: destination, storageKey };
}

export async function managedMediaExists(uri: string) {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
}

export async function deleteManagedMedia(uri: string) {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    // Best-effort cleanup. Database state remains authoritative.
  }
}
