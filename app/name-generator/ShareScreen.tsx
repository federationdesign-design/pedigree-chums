"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./ShareScreen.module.css";
import { ShortlistEntry } from "./ShortlistBar";

type Platform = "instagram" | "twitter" | "tiktok" | "none" | null;

type Props = {
  finalists: ShortlistEntry[];
  breed: string;
  platform: Platform;
  onBack: () => void;
};

function drawShareImage(canvas: HTMLCanvasElement, finalists: ShortlistEntry[], breed: string) {
  const W = 1080, H = 1080;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#00e2ff");
  grad.addColorStop(1, "#008eff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Navy panel
  ctx.fillStyle = "rgba(10,58,87,0.85)";
  roundRect(ctx, 60, 60, W - 120, H - 120, 48);
  ctx.fill();

  // Title
  ctx.fillStyle = "#ffe227";
  ctx.font = `bold 72px 'Luckiest Guy', cursive`;
  ctx.textAlign = "center";
  ctx.fillText("What should I call my", W / 2, 200);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 80px 'Luckiest Guy', cursive`;
  ctx.fillText(breed || "doggy", W / 2, 290);
  ctx.fillStyle = "#ffe227";
  ctx.fillText("?", W / 2 + ctx.measureText(breed || "doggy").width / 2 + 20, 290);

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, 330); ctx.lineTo(W - 120, 330);
  ctx.stroke();

  // Name cards
  const cardH = 120;
  const cardPad = 20;
  const totalCardH = finalists.length * (cardH + cardPad);
  let y = (H - totalCardH) / 2 + 60;

  finalists.forEach((f, i) => {
    // Card bg
    ctx.fillStyle = "#ffe227";
    roundRect(ctx, 120, y, W - 240, cardH, 24);
    ctx.fill();

    // Number badge
    ctx.fillStyle = "rgba(10,58,87,0.3)";
    ctx.beginPath();
    ctx.arc(170, y + cardH / 2, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0a3a57";
    ctx.font = `bold 28px 'Luckiest Guy', cursive`;
    ctx.textAlign = "center";
    ctx.fillText(String(i + 1), 170, y + cardH / 2 + 10);

    // Name
    ctx.fillStyle = "#0a3a57";
    ctx.font = `bold 48px 'Luckiest Guy', cursive`;
    ctx.textAlign = "left";
    ctx.fillText(f.full, 220, y + 58);

    // Nickname
    if (f.nickname && f.nickname !== f.full) {
      ctx.fillStyle = "rgba(10,58,87,0.6)";
      ctx.font = `italic 28px sans-serif`;
      ctx.fillText(`"${f.nickname}"`, 222, y + 92);
    }

    y += cardH + cardPad;
  });

  // Branding
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = `bold 28px 'Luckiest Guy', cursive`;
  ctx.textAlign = "center";
  ctx.fillText("pedigreechums.co.uk", W / 2, H - 80);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export default function ShareScreen({ finalists, breed, platform, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const caption = `What should I call my ${breed || "doggy"}? 🐾\n\n${finalists.map((f, i) => `${i + 1}. ${f.full}`).join("\n")}\n\nGenerated at pedigreechums.co.uk`;

  useEffect(() => {
    if (canvasRef.current) drawShareImage(canvasRef.current, finalists, breed);
  }, [finalists, breed]);

  async function handleShare() {
    setSharing(true);
    try {
      const canvas = canvasRef.current!;
      const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
      const file = new File([blob], "pedigree-chums-names.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: caption });
      } else {
        // Fallback: download image + copy caption
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "pedigree-chums-names.png"; a.click();
        URL.revokeObjectURL(url);
        await navigator.clipboard.writeText(caption);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch { /* user cancelled */ }
    setSharing(false);
  }

  async function handleCopyCaption() {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <div className={styles.wrap}>
      <button className={styles.backBtn} onClick={onBack}>← Back</button>

      <h2 className={`display ${styles.title}`}>
        <span className={styles.yellow}>Your</span> finalists
      </h2>

      <div className={styles.finalists}>
        {finalists.map((f, i) => (
          <div key={f.full} className={styles.finalist}>
            <span className={styles.num}>{i + 1}</span>
            <div>
              <p className={styles.name}>{f.full}</p>
              {f.nickname && f.nickname !== f.full && (
                <p className={styles.nick}>"{f.nickname}"</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.previewWrap}>
        <canvas ref={canvasRef} className={styles.preview} />
      </div>

      <div className={styles.caption}>
        <p className={styles.captionText}>{caption}</p>
      </div>

      <div className={styles.btns}>
        <button className={styles.shareBtn} onClick={handleShare} disabled={sharing}>
          {sharing ? "Sharing..." : "📤 Share"}
        </button>
        <button className={styles.copyBtn} onClick={handleCopyCaption}>
          {copied ? "✓ Copied!" : "📋 Copy caption"}
        </button>
      </div>

      <p className={styles.hint}>
        {platform === "instagram"
          ? "📸 On Instagram: share the image then add a poll sticker with your names"
          : platform === "twitter"
          ? "𝕏 On X: paste the caption and add a poll with your names"
          : platform === "tiktok"
          ? "🎵 On TikTok: share the image then add a poll in the editor"
          : "Save the image and share anywhere you like!"}
      </p>
    </div>
  );
}
