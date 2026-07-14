import { useState } from "react";
import { toast } from "sonner";
import { HiOutlineArrowPath, HiOutlineArrowDownTray, HiOutlinePlus } from "react-icons/hi2";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { SkeletonCards } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useCreateQrCode, useQrCodes, useRegenerateQrCode, useToggleQrCode } from "../../hooks/useQr";
import { useTables } from "../../hooks/useTables";
import { api, getErrorMessage } from "../../lib/axios";
import { resolveAssetUrl } from "../../lib/assets";

export default function QRManagement() {
  const { data: qrCodes, isLoading } = useQrCodes();
  const { data: tables } = useTables();
  const createQr = useCreateQrCode();
  const regenerateQr = useRegenerateQrCode();
  const toggleQr = useToggleQrCode();

  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<"BRANCH" | "TABLE">("BRANCH");
  const [tableId, setTableId] = useState("");

  const handleCreate = () => {
    createQr.mutate(
      { type, tableId: type === "TABLE" ? tableId : undefined },
      {
        onSuccess: () => {
          toast.success("QR code generated");
          setModalOpen(false);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const handleDownload = async (id: string, label: string) => {
    const res = await api.get(`/qr-codes/${id}/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(res.data as Blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${label}-qr.png`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <HiOutlinePlus size={16} className="mr-1" /> Generate QR Code
        </Button>
      </div>

      {isLoading ? (
        <SkeletonCards count={4} />
      ) : !qrCodes || qrCodes.length === 0 ? (
        <EmptyState title="No QR codes yet" description="Generate a branch or table QR code to start serving your digital menu." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {qrCodes.map((qr) => (
            <Card key={qr.id} className="flex flex-col items-center gap-3 text-center">
              {qr.imageUrl ? (
                <img src={resolveAssetUrl(qr.imageUrl)} alt="QR" className="h-32 w-32 rounded-xl border border-[var(--border-color)] object-contain p-2" />
              ) : (
                <div className="h-32 w-32 rounded-xl bg-[var(--bg-surface-2)]" />
              )}
              <div>
                <p className="font-medium">{qr.type === "TABLE" ? qr.table?.name ?? "Table" : "Branch Menu"}</p>
                <p className="text-xs text-[var(--text-muted)]">{qr.scanCount} scans</p>
              </div>
              <Badge tone={qr.isActive ? "good" : "neutral"}>{qr.isActive ? "Enabled" : "Disabled"}</Badge>
              <div className="flex w-full gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDownload(qr.id, qr.type.toLowerCase())}>
                  <HiOutlineArrowDownTray size={14} />
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => regenerateQr.mutate(qr.id)}>
                  <HiOutlineArrowPath size={14} />
                </Button>
                <Button
                  variant={qr.isActive ? "danger" : "primary"}
                  size="sm"
                  className="flex-1"
                  onClick={() => toggleQr.mutate({ id: qr.id, isActive: !qr.isActive })}
                >
                  {qr.isActive ? "Disable" : "Enable"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Generate QR Code" maxWidth="max-w-sm">
        <div className="space-y-4">
          <Select label="Type" value={type} onChange={(e) => setType(e.target.value as "BRANCH" | "TABLE")}>
            <option value="BRANCH">Branch (whole restaurant menu)</option>
            <option value="TABLE">Specific Table</option>
          </Select>
          {type === "TABLE" && (
            <Select label="Table" value={tableId} onChange={(e) => setTableId(e.target.value)}>
              <option value="">Select table</option>
              {tables?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={createQr.isPending} disabled={type === "TABLE" && !tableId}>
              Generate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
