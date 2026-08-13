"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  active: boolean;
  onScan: (token: string) => void;
  onStop?: () => void;
};

export function QrScanner({ active, onScan, onStop }: Props) {
  const regionId = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handlingRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onStopRef = useRef(onStop);
  onScanRef.current = onScan;
  onStopRef.current = onStop;

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      setRunning(false);
      return;
    }
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
    handlingRef.current = false;
    setError(null);
    await stop();
    try {
      const scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          if (!decoded || handlingRef.current) return;
          handlingRef.current = true;
          void (async () => {
            await stop();
            onStopRef.current?.();
            onScanRef.current(decoded);
          })();
        },
        () => undefined,
      );
      setRunning(true);
    } catch {
      setError(
        "Không mở được camera. Cần HTTPS (hoặc localhost), cấp quyền camera, hoặc dùng nhập MSSV bên dưới.",
      );
      setRunning(false);
      onStopRef.current?.();
    }
  }, [regionId, stop]);

  useEffect(() => {
    if (active) {
      void start();
    } else {
      void stop();
    }
    return () => {
      void stop();
    };
  }, [active, start, stop]);

  return (
    <div className="space-y-3">
      <div
        id={regionId}
        className="relative overflow-hidden rounded-xl border border-[var(--line)] bg-black/90 min-h-[260px]"
      >
        {!running ? (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-white/70">
            Camera đang tắt. Bấm &quot;Bật camera&quot; để quét.
          </div>
        ) : null}
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
