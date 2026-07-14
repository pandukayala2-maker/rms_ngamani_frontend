import { API_ORIGIN } from "./axios";

// Menu/category images and QR code images are stored as backend-relative paths
// (e.g. "/uploads/images/xxx.png"). Locally these resolve fine against the
// frontend's own origin via the dev/nginx proxy. When the frontend is hosted
// separately from the backend (Vercel + Render), they must be resolved against
// the backend's origin instead.
export function resolveAssetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_ORIGIN) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}
