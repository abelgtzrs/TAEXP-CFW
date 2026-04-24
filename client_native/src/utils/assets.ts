import { resolvePublicBaseUrl } from "@/services/api/client";

export function buildPublicAssetUrl(assetPath?: string | null) {
  if (!assetPath) {
    return null;
  }

  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  const normalizedPath = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  return `${resolvePublicBaseUrl()}${normalizedPath}`;
}
