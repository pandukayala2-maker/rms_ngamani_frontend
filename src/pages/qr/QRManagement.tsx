import { useEffect, useRef, useState } from "react";
import { HiOutlineArrowPath, HiOutlineArrowDownTray } from "react-icons/hi2";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useQrCode, useRegenerateQrCode, useToggleQrCode } from "../../hooks/useQr";
import { useSettings } from "../../hooks/useSettings";
import { resolveAssetUrl } from "../../lib/assets";

const CARD_W = 800;
const CARD_H = 1200;

const FEATURES = [
  { icon: "📱", label: "Digital Menu" },
  { icon: "🖼️", label: "Beautiful Images" },
  { icon: "✨", label: "Easy & Contactless" },
  { icon: "⏱️", label: "Save Time" },
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lineHeight));
}

async function renderCard(
  canvas: HTMLCanvasElement,
  opts: { qrUrl: string; logoUrl: string; restaurantName: string; address?: string | null; contact?: string | null }
) {
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H);
  bg.addColorStop(0, "#161311");
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const pad = 28;
  roundRect(ctx, pad, pad, CARD_W - pad * 2, CARD_H - pad * 2, 24);
  ctx.strokeStyle = "#d4a017";
  ctx.lineWidth = 4;
  ctx.stroke();
  roundRect(ctx, pad + 10, pad + 10, CARD_W - (pad + 10) * 2, CARD_H - (pad + 10) * 2, 18);
  ctx.strokeStyle = "rgba(212,160,23,0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = "center";
  let y = pad + 70;

  try {
    const logo = await loadImage(opts.logoUrl);
    const logoH = 130;
    const logoW = logo.width * (logoH / logo.height);
    ctx.drawImage(logo, CARD_W / 2 - logoW / 2, y - logoH + 20, logoW, logoH);
    y += 40;
  } catch {
    // logo failed to load — proceed without it
  }

  ctx.fillStyle = "#f3cd6e";
  ctx.font = "700 34px Georgia, serif";
  ctx.fillText(opts.restaurantName.toUpperCase(), CARD_W / 2, y);
  y += 46;

  ctx.strokeStyle = "#d4a017";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CARD_W / 2 - 60, y);
  ctx.lineTo(CARD_W / 2 + 60, y);
  ctx.stroke();
  y += 54;

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 42px Arial, sans-serif";
  ctx.fillText("SCAN TO VIEW MENU", CARD_W / 2, y);
  y += 50;

  const panelSize = 420;
  const panelX = CARD_W / 2 - panelSize / 2;
  roundRect(ctx, panelX, y, panelSize, panelSize, 20);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#d4a017";
  ctx.lineWidth = 4;
  ctx.stroke();

  try {
    const qr = await loadImage(opts.qrUrl);
    const qrPad = 30;
    ctx.drawImage(qr, panelX + qrPad, y + qrPad, panelSize - qrPad * 2, panelSize - qrPad * 2);
  } catch {
    // QR failed to load — panel stays blank
  }
  y += panelSize + 56;

  ctx.fillStyle = "#e9b53e";
  ctx.font = "italic 700 44px Georgia, serif";
  ctx.fillText("Order. Enjoy!", CARD_W / 2, y);
  y += 74;

  const colW = (CARD_W - pad * 2 - 40) / FEATURES.length;
  FEATURES.forEach((f, i) => {
    const cx = pad + 20 + colW * i + colW / 2;
    ctx.beginPath();
    ctx.arc(cx, y, 34, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(212,160,23,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "28px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(f.icon, cx, y + 10);
    ctx.font = "600 15px Arial";
    ctx.fillStyle = "#cccccc";
    wrapText(ctx, f.label, cx, y + 62, colW - 6, 18);
  });
  y += 140;

  const footer = [opts.address, opts.contact].filter(Boolean).join("   •   ");
  if (footer) {
    ctx.font = "13px Arial";
    ctx.fillStyle = "#888888";
    ctx.fillText(footer, CARD_W / 2, CARD_H - pad - 22);
  }
}

export default function QRManagement() {
  const { data: qr, isLoading } = useQrCode();
  const { data: settings } = useSettings();
  const regenerateQr = useRegenerateQrCode();
  const toggleQr = useToggleQrCode();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    if (!qr?.imageUrl || !canvasRef.current) return;
    let cancelled = false;
    setRendering(true);
    renderCard(canvasRef.current, {
      qrUrl: resolveAssetUrl(qr.imageUrl)!,
      logoUrl: "/logo.png",
      restaurantName: settings?.restaurantName ?? "Nadhamuni",
      address: settings?.address,
      contact: settings?.contact,
    }).finally(() => {
      if (!cancelled) setRendering(false);
    });
    return () => {
      cancelled = true;
    };
  }, [qr?.imageUrl, settings?.restaurantName, settings?.address, settings?.contact]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "nadhamuni-menu-qr.png";
      link.click();
      window.URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <Card className="flex flex-col items-center gap-3">
          <Skeleton className="h-96 w-64 rounded-xl" />
        </Card>
      ) : !qr ? (
        <EmptyState title="QR code unavailable" description="Something went wrong generating your restaurant's QR code." />
      ) : (
        <div className="max-w-sm">
          <Card className="flex flex-col items-center gap-3 text-center">
            <canvas
              ref={canvasRef}
              className="w-full max-w-[280px] rounded-xl border border-[var(--border-color)] shadow-lg"
              style={{ aspectRatio: `${CARD_W} / ${CARD_H}` }}
            />
            <div>
              <p className="font-medium">Restaurant Menu QR</p>
              <p className="text-xs text-[var(--text-muted)]">{qr.scanCount} scans</p>
            </div>
            <Badge tone={qr.isActive ? "good" : "neutral"}>{qr.isActive ? "Enabled" : "Disabled"}</Badge>
            <div className="flex w-full gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload} disabled={rendering}>
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
