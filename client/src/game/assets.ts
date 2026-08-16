/**
 * Deploy-safe storage URLs: Manus serves assets locally, while GitHub Pages
 * reads the same published asset set from the live public portfolio origin.
 */
const publishedAssetOrigin = "https://diwasexplor-8hxow3bb.manus.space";

export function assetUrl(path: string) {
  return import.meta.env.VITE_GITHUB_PAGES === "true" ? `${publishedAssetOrigin}${path}` : path;
}
