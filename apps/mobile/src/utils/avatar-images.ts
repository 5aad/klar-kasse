import * as FileSystem from "expo-file-system/legacy";

const AVATAR_STORAGE_BASE_URL =
  "https://scxkggwbkyrtujvewtxw.supabase.co/storage/v1/object/public/avatar";
const DEFAULT_AVATAR_COUNT = 6;
export const MAX_AVATAR_SCAN_COUNT = 120;
const MAX_CONSECUTIVE_MISSING_AVATARS = 6;

export const avatarImageUrls = Array.from(
  { length: DEFAULT_AVATAR_COUNT },
  (_, index) => getAvatarImageUrl(index + 1),
);

function getAvatarImageUrl(index: number) {
  return `${AVATAR_STORAGE_BASE_URL}/portrait_${index}.png`;
}

export function getPotentialAvatarImageUrls() {
  return Array.from({ length: MAX_AVATAR_SCAN_COUNT }, (_, index) =>
    getAvatarImageUrl(index + 1),
  );
}

async function hasRemoteAvatarImage(url: string) {
  try {
    const response = await fetch(url, { method: "HEAD" });

    return response.ok;
  } catch {
    return false;
  }
}

export async function discoverAvatarImageUrls() {
  const discoveredUrls: string[] = [];
  let missingCount = 0;

  for (let index = 1; index <= MAX_AVATAR_SCAN_COUNT; index += 1) {
    const url = getAvatarImageUrl(index);
    const exists = await hasRemoteAvatarImage(url);

    if (exists) {
      discoveredUrls.push(url);
      missingCount = 0;
      continue;
    }

    missingCount += 1;

    if (missingCount >= MAX_CONSECUTIVE_MISSING_AVATARS) {
      break;
    }
  }

  return discoveredUrls;
}

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

export async function getDownloadedAvatarImageUrls(
  avatarUrls = avatarImageUrls,
) {
  const downloadedUrls = (
    await Promise.all(
      avatarUrls.map(async (url) =>
        (await isAvatarImageDownloaded(url)) ? url : null,
      ),
    )
  ).filter((url): url is string => Boolean(url));

  return downloadedUrls;
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
