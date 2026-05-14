import * as FileSystem from "expo-file-system/legacy";

const AVATAR_STORAGE_BASE_URL =
  "https://scxkggwbkyrtujvewtxw.supabase.co/storage/v1/object/public/avatar";

export const avatarImageUrls = Array.from(
  { length: 6 },
  (_, index) => `${AVATAR_STORAGE_BASE_URL}/portrait_${index + 1}.png`,
);

export function getAvatarFileName(url: string) {
  return url.split("/").at(-1)?.split("?")[0] ?? "avatar.png";
}

export function getAvatarLocalUri(url: string) {
  return `${FileSystem.documentDirectory}avatars/${getAvatarFileName(url)}`;
}

export async function isAvatarImageDownloaded(url: string) {
  const existingFile = await FileSystem.getInfoAsync(getAvatarLocalUri(url));

  return existingFile.exists;
}

export async function downloadAvatarImage(url: string) {
  const fileName = getAvatarFileName(url);
  const avatarDirectory = `${FileSystem.documentDirectory}avatars/`;
  const localUri = getAvatarLocalUri(url);

  await FileSystem.makeDirectoryAsync(avatarDirectory, {
    intermediates: true,
  });

  const existingFile = await FileSystem.getInfoAsync(localUri);

  if (existingFile.exists) {
    return localUri;
  }

  const downloadResult = await FileSystem.downloadAsync(url, localUri);

  return downloadResult.uri;
}
