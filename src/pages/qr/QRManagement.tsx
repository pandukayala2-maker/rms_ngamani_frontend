import { HiOutlineArrowPath, HiOutlineArrowDownTray } from "react-icons/hi2";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useQrCode, useRegenerateQrCode, useToggleQrCode } from "../../hooks/useQr";
import { api } from "../../lib/axios";
import { resolveAssetUrl } from "../../lib/assets";

export default function QRManagement() {
  const { data: qr, isLoading } = useQrCode();
  const regenerateQr = useRegenerateQrCode();
  const toggleQr = useToggleQrCode();

  const handleDownload = async () => {
    const res = await api.get(`/qr-codes/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(res.data as Blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "restaurant-qr.png";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <Card className="flex flex-col items-center gap-3">
          <Skeleton className="h-40 w-40 rounded-xl" />
          <Skeleton className="h-4 w-32" />
        </Card>
      ) : !qr ? (
        <EmptyState title="QR code unavailable" description="Something went wrong generating your restaurant's QR code." />
      ) : (
        <div className="max-w-sm">
          <Card className="flex flex-col items-center gap-3 text-center">
            {qr.imageUrl ? (
              <img
                src={resolveAssetUrl(qr.imageUrl)}
                alt="Restaurant QR"
                className="h-48 w-48 rounded-xl border border-[var(--border-color)] object-contain p-2"
              />
            ) : (
              <div className="h-48 w-48 rounded-xl bg-[var(--bg-surface-2)]" />
            )}
            <div>
              <p className="font-medium">Restaurant Menu QR</p>
              <p className="text-xs text-[var(--text-muted)]">{qr.scanCount} scans</p>
            </div>
            <Badge tone={qr.isActive ? "good" : "neutral"}>{qr.isActive ? "Enabled" : "Disabled"}</Badge>
            <div className="flex w-full gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
                <HiOutlineArrowDownTray size={14} className="mr-1" /> Download
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => regenerateQr.mutate()}>
                <HiOutlineArrowPath size={14} className="mr-1" /> Regenerate
              </Button>
            </div>
            <Button
              variant={qr.isActive ? "danger" : "primary"}
              size="sm"
              className="w-full"
              onClick={() => toggleQr.mutate(!qr.isActive)}
            >
              {qr.isActive ? "Disable" : "Enable"}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
