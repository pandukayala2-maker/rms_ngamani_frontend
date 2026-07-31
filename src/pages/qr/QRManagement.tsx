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
  { label: "Digital Menu", desc: "Browse our full menu" },
  { label: "Beautiful Images", desc: "See what you'll love" },
  { label: "Easy & Contactless", desc: "Safe & hygienic" },
  { label: "Save Time", desc: "Quick & convenient" },
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

// Custom leaf drawing helpers for premium look
function drawGreenLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * Math.PI / 180);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.4, -size * 0.4, size, 0);
  ctx.quadraticCurveTo(size * 0.4, size * 0.4, 0, 0);
  
  // Create gradient for realistic leaf look
  const leafGrad = ctx.createLinearGradient(0, 0, size, 0);
  leafGrad.addColorStop(0, "#0E3E2E");
  leafGrad.addColorStop(1, "#1B5E43");
  ctx.fillStyle = leafGrad;
  ctx.fill();
  
  // Leaf vein
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.9, 0);
  ctx.strokeStyle = "#C5A059";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawGoldLeafBranch(ctx: CanvasRenderingContext2D, startX: number, startY: number, scaleX: number, angle: number) {
  ctx.save();
  ctx.translate(startX, startY);
  ctx.scale(scaleX, 1);
  ctx.rotate(angle * Math.PI / 180);
  
  // Stem
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(40, -40, 100, -10, 140, 60);
  ctx.strokeStyle = "rgba(197, 160, 89, 0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Leaves
  const leafPositions = [
    { x: 30, y: -25, a: -45 },
    { x: 60, y: -22, a: -30 },
    { x: 90, y: -5, a: -10 },
    { x: 120, y: 25, a: 20 },
    { x: 138, y: 55, a: 50 },
  ];
  
  leafPositions.forEach((pos) => {
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(pos.a * Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(10, -8, 25, 0);
    ctx.quadraticCurveTo(10, 8, 0, 0);
    ctx.fillStyle = "rgba(197, 160, 89, 0.15)";
    ctx.fill();
    ctx.strokeStyle = "rgba(197, 160, 89, 0.5)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  });
  
  ctx.restore();
}

// Vector Icon Drawing functions
function drawIcon(ctx: CanvasRenderingContext2D, type: string, cx: number, cy: number) {
  ctx.save();
  ctx.strokeStyle = "#C5A059";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  
  if (type === "menu") {
    // Document / Menu list
    ctx.beginPath();
    ctx.rect(cx - 10, cy - 12, 20, 24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 6);
    ctx.lineTo(cx + 5, cy - 6);
    ctx.moveTo(cx - 5, cy);
    ctx.lineTo(cx + 5, cy);
    ctx.moveTo(cx - 5, cy + 6);
    ctx.lineTo(cx + 1, cy + 6);
    ctx.stroke();
  } else if (type === "images") {
    // Picture Frame
    ctx.beginPath();
    ctx.rect(cx - 12, cy - 10, 24, 20);
    ctx.stroke();
    // Mountains
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 6);
    ctx.lineTo(cx - 4, cy - 2);
    ctx.lineTo(cx + 2, cy + 4);
    ctx.lineTo(cx + 7, cy - 1);
    ctx.lineTo(cx + 12, cy + 6);
    ctx.stroke();
    // Sun
    ctx.beginPath();
    ctx.arc(cx + 4, cy - 4, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#C5A059";
    ctx.fill();
  } else if (type === "contactless") {
    // Hand clicking
    ctx.beginPath();
    // Circle ripples
    ctx.arc(cx, cy - 4, 6, 0, Math.PI * 2);
    ctx.stroke();
    // Pointing Hand outline
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy + 12);
    ctx.lineTo(cx - 2, cy + 2);
    ctx.lineTo(cx, cy - 6); // index finger
    ctx.lineTo(cx + 2, cy + 2);
    ctx.lineTo(cx + 6, cy + 4);
    ctx.lineTo(cx + 4, cy + 10);
    ctx.lineTo(cx - 2, cy + 12);
    ctx.stroke();
  } else if (type === "time") {
    // Clock
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.stroke();
    // Hands
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - 6);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 5, cy);
    ctx.stroke();
  }
  ctx.restore();
}

async function renderCard(
  canvas: HTMLCanvasElement,
  opts: { qrUrl: string; logoUrl: string; restaurantName: string; address?: string | null; contact?: string | null }
) {
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 1. Solid Ivory Background
  ctx.fillStyle = "#FCFAF7";
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Borders configuration
  const pad = 28;
  
  // 2. Outer Gold Border
  roundRect(ctx, pad, pad, CARD_W - pad * 2, CARD_H - pad * 2, 28);
  ctx.strokeStyle = "#C5A059";
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // 3. Inner Fine Gold Border
  roundRect(ctx, pad + 12, pad + 12, CARD_W - (pad + 12) * 2, CARD_H - (pad + 12) * 2, 20);
  ctx.strokeStyle = "rgba(197, 160, 89, 0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // 4. Draw Corner Green Leaves (Top-Left)
  ctx.save();
  // Stem
  ctx.beginPath();
  ctx.moveTo(pad + 15, pad + 80);
  ctx.bezierCurveTo(pad + 60, pad + 60, pad + 80, pad + 30, pad + 120, pad + 15);
  ctx.strokeStyle = "rgba(27, 94, 67, 0.25)";
  ctx.lineWidth = 3;
  ctx.stroke();
  
  drawGreenLeaf(ctx, pad + 20, pad + 70, -25, 45);
  drawGreenLeaf(ctx, pad + 45, pad + 55, -15, 50);
  drawGreenLeaf(ctx, pad + 75, pad + 35, 10, 48);
  drawGreenLeaf(ctx, pad + 110, pad + 22, 35, 42);
  ctx.restore();

  // 5. Draw Gold Leaf Branches (Bottom Corners)
  drawGoldLeafBranch(ctx, pad + 20, CARD_H - pad - 240, 1, 35);
  drawGoldLeafBranch(ctx, CARD_W - pad - 20, CARD_H - pad - 240, -1, 35);

  ctx.textAlign = "center";
  let y = pad + 100;

  // 6. Circular Logo Badge
  ctx.save();
  const logoRadius = 54;
  const logoCX = CARD_W / 2;
  const logoCY = y + logoRadius;
  
  // Outer gold rim
  ctx.beginPath();
  ctx.arc(logoCX, logoCY, logoRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#0C2B24"; // Forest Green base
  ctx.fill();
  ctx.strokeStyle = "#C5A059";
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Try loading provided logo, or fall back to drawing an elegant N
  let logoLoaded = false;
  try {
    const logoImg = await loadImage(opts.logoUrl);
    ctx.beginPath();
    ctx.arc(logoCX, logoCY, logoRadius - 4, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImg, logoCX - logoRadius, logoCY - logoRadius, logoRadius * 2, logoRadius * 2);
    logoLoaded = true;
  } catch {
    // fallback
  }

  if (!logoLoaded) {
    // Draw Elegant Gold Monogram
    ctx.fillStyle = "#C5A059";
    ctx.font = "800 50px 'Cinzel', serif";
    ctx.fillText("N", logoCX, logoCY + 16);
    
    // Tiny gold crown dot decoration
    ctx.beginPath();
    ctx.arc(logoCX, logoCY - 22, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  
  y += logoRadius * 2 + 50;

  // 7. Restaurant Name
  ctx.fillStyle = "#0C2B24";
  ctx.font = "800 38px 'Cinzel', serif";
  ctx.fillText(opts.restaurantName.toUpperCase(), CARD_W / 2, y);
  y += 38;

  // 8. Tagline
  ctx.fillStyle = "#C5A059";
  ctx.font = "700 15px 'Cinzel', 'Inter', sans-serif";
  ctx.letterSpacing = "2px"; // supported in modern 2D context
  ctx.fillText("EXPERIENCE HOSPITALITY", CARD_W / 2, y);
  y += 24;

  // 9. Diamond ornament
  ctx.fillStyle = "#C5A059";
  ctx.beginPath();
  ctx.moveTo(CARD_W / 2, y);
  ctx.lineTo(CARD_W / 2 + 6, y + 6);
  ctx.lineTo(CARD_W / 2, y + 12);
  ctx.lineTo(CARD_W / 2 - 6, y + 6);
  ctx.closePath();
  ctx.fill();
  y += 50;

  // 10. Title
  ctx.fillStyle = "#0C2B24";
  ctx.font = "800 40px 'Cinzel', 'Inter', sans-serif";
  ctx.fillText("SCAN TO VIEW MENU", CARD_W / 2, y);
  y += 34;

  // 11. Subtitle
  ctx.fillStyle = "#6B7280";
  ctx.font = "500 18px 'Inter', sans-serif";
  ctx.fillText("Explore our delicious food & drinks", CARD_W / 2, y);
  y += 44;

  // 12. QR Code Frame / Panel
  const panelSize = 400;
  const panelX = CARD_W / 2 - panelSize / 2;
  
  // Rounded white card with drop shadow
  ctx.save();
  ctx.shadowColor = "rgba(12, 43, 36, 0.15)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, panelX, y, panelSize, panelSize, 24);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.restore();

  // Draw QR code image
  try {
    const qr = await loadImage(opts.qrUrl);
    const qrPad = 32;
    ctx.drawImage(qr, panelX + qrPad, y + qrPad, panelSize - qrPad * 2, panelSize - qrPad * 2);
    
    // 13. Draw Fork and Spoon Center Badge inside QR code
    const badgeSize = 74;
    const badgeX = CARD_W / 2 - badgeSize / 2;
    const badgeY = y + panelSize / 2 - badgeSize / 2;
    
    ctx.save();
    // Inner badge container
    roundRect(ctx, badgeX, badgeY, badgeSize, badgeSize, 14);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = "#C5A059";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // Fork and Spoon drawing inside badge
    ctx.strokeStyle = "#C5A059";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    
    // Spoon
    const spoonX = CARD_W / 2 + 10;
    ctx.beginPath();
    // bowl
    ctx.arc(spoonX, badgeY + 28, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#C5A059";
    ctx.fill();
    // stem
    ctx.moveTo(spoonX, badgeY + 33);
    ctx.lineTo(spoonX, badgeY + 52);
    ctx.stroke();
    
    // Fork
    const forkX = CARD_W / 2 - 10;
    ctx.beginPath();
    // head base
    ctx.moveTo(forkX - 4, badgeY + 30);
    ctx.lineTo(forkX + 4, badgeY + 30);
    ctx.lineTo(forkX + 2, badgeY + 34);
    ctx.lineTo(forkX - 2, badgeY + 34);
    ctx.closePath();
    ctx.fillStyle = "#C5A059";
    ctx.fill();
    // tines
    ctx.moveTo(forkX - 4, badgeY + 24);
    ctx.lineTo(forkX - 4, badgeY + 30);
    ctx.moveTo(forkX - 1.2, badgeY + 24);
    ctx.lineTo(forkX - 1.2, badgeY + 30);
    ctx.moveTo(forkX + 1.2, badgeY + 24);
    ctx.lineTo(forkX + 1.2, badgeY + 30);
    ctx.moveTo(forkX + 4, badgeY + 24);
    ctx.lineTo(forkX + 4, badgeY + 30);
    // handle
    ctx.moveTo(forkX, badgeY + 34);
    ctx.lineTo(forkX, badgeY + 52);
    ctx.stroke();
    
    ctx.restore();
  } catch {
    // no QR code
  }
  y += panelSize + 48;

  // 14. "Order. Enjoy!" script text
  ctx.fillStyle = "#0C2B24";
  ctx.font = "italic 52px 'Great Vibes', cursive";
  ctx.fillText("Order. Enjoy!", CARD_W / 2, y);
  y += 64;

  // 15. Features Panel (Light off-white rounded panel)
  const featuresW = CARD_W - pad * 2 - 50;
  const featuresX = CARD_W / 2 - featuresW / 2;
  const featuresY = y;
  const featuresH = 144;
  
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.04)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, featuresX, featuresY, featuresW, featuresH, 20);
  ctx.fillStyle = "#F5F3ED"; // Warm light grey panel
  ctx.fill();
  ctx.strokeStyle = "rgba(197, 160, 89, 0.18)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  const colW = featuresW / FEATURES.length;
  const types = ["menu", "images", "contactless", "time"];
  
  FEATURES.forEach((f, i) => {
    const cx = featuresX + colW * i + colW / 2;
    const cy = featuresY + 44;
    
    // Circle container
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fillStyle = "#0C2B24";
    ctx.fill();
    ctx.strokeStyle = "#C5A059";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Draw Vector Icon
    drawIcon(ctx, types[i], cx, cy);
    
    // Header
    ctx.fillStyle = "#0C2B24";
    ctx.font = "800 13px 'Inter', sans-serif";
    ctx.fillText(f.label, cx, featuresY + 94);
    
    // Description
    ctx.fillStyle = "#6B7280";
    ctx.font = "500 10.5px 'Inter', sans-serif";
    ctx.fillText(f.desc, cx, featuresY + 114);
  });

  // 16. Bottom wave footer section in forest green
  ctx.save();
  ctx.fillStyle = "#0C2B24";
  ctx.beginPath();
  ctx.moveTo(pad, CARD_H - pad);
  ctx.lineTo(pad, CARD_H - 120);
  // Elegant arches
  ctx.quadraticCurveTo(pad + 120, CARD_H - 120, pad + 160, CARD_H - 65);
  ctx.lineTo(CARD_W - pad - 160, CARD_H - 65);
  ctx.quadraticCurveTo(CARD_W - pad - 120, CARD_H - 120, CARD_W - pad, CARD_H - 120);
  ctx.lineTo(CARD_W - pad, CARD_H - pad);
  ctx.closePath();
  ctx.fill();
  
  // Contour Gold Line
  ctx.beginPath();
  ctx.moveTo(pad, CARD_H - 120);
  ctx.quadraticCurveTo(pad + 120, CARD_H - 120, pad + 160, CARD_H - 65);
  ctx.lineTo(CARD_W - pad - 160, CARD_H - 65);
  ctx.quadraticCurveTo(CARD_W - pad - 120, CARD_H - 120, CARD_W - pad, CARD_H - 120);
  ctx.strokeStyle = "#C5A059";
  ctx.lineWidth = 3.5;
  ctx.stroke();
  
  // Bottom text
  ctx.fillStyle = "#C5A059";
  ctx.font = "800 14px 'Cinzel', serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("THANK YOU!", CARD_W / 2, CARD_H - pad - 42);
  
  // Heart
  ctx.font = "14px 'Inter', sans-serif";
  ctx.fillText("♥", CARD_W / 2, CARD_H - pad - 22);
  ctx.restore();
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
    
    // Wait for custom Google fonts to load so they render correctly on the canvas
    document.fonts.ready.then(() => {
      if (cancelled) return;
      renderCard(canvasRef.current!, {
        qrUrl: resolveAssetUrl(qr.imageUrl)!,
        logoUrl: "/logo.png",
        restaurantName: settings?.restaurantName ?? "Nadhamuni",
        address: settings?.address,
        contact: settings?.contact,
      }).finally(() => {
        if (!cancelled) setRendering(false);
      });
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
      link.download = `${(settings?.restaurantName ?? "nadhamuni").toLowerCase().replace(/\s+/g, "-")}-menu-qr.png`;
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
