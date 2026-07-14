import { api } from "./axios";

export async function openReceipt(orderId: string): Promise<void> {
  const res = await api.get(`/orders/${orderId}/receipt`, { responseType: "blob" });
  const url = window.URL.createObjectURL(res.data as Blob);
  window.open(url, "_blank");
  // Revoke after the new tab has had time to load the blob.
  setTimeout(() => window.URL.revokeObjectURL(url), 30_000);
}
