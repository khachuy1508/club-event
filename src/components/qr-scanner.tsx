"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  onScan: (token: string) => void;
};

export function QrScanner({ onScan }: Props) {
  const regionId = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastRef = useRef<string>("");

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      await scanner.clear();
    } catch {
      // ignore stop races
    }
    scannerRef.current = null;
    setRunning(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    await stop();
    try {
      const scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          if (decoded && decoded !== lastRef.current) {
            lastRef.current = decoded;
            onScan(decoded);
            window.setTimeout(() => {
              lastRef.current = "";
            }, 2500);
          }
        },
        () => undefined,
      );
      setRunning(true);
    } catch {
      setError(
        "Không mở được camera. Cần HTTPS (hoặc localhost), cấp quyền camera, hoặc dùng nhập MSSV bên dưới.",
      );
      setRunning(false);
    }
  }, [onScan, regionId, stop]);

  useEffect(() => {
    void start();
    return () => {
      void stop();
    };
  }, [start, stop]);

  return (
    <div className="space-y-3">
      <div
        id={regionId}
        className="overflow-hidden rounded-xl border border-[var(--line)] bg-black/90 min-h-[260px]"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void start()}
          className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white"
        >
          {running ? "Khởi động lại camera" : "Bật camera"}
        </button>
        <button
          type="button"
          onClick={() => void stop()}
          className="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
        >
          Tắt
        </button>
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
