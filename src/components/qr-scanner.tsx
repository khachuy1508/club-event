"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  active: boolean;
  onScan: (token: string) => void;
  onStop?: () => void;
};

export function QrScanner({ active, onScan, onStop }: Props) {
  const regionId = `qr-${useId().replace(/:/g, "")}`;
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handlingRef = useRef(false);
  const sessionRef = useRef(0);
  const onScanRef = useRef(onScan);
  const onStopRef = useRef(onStop);
  onScanRef.current = onScan;
  onStopRef.current = onStop;

  useEffect(() => {
    let cancelled = false;
    const session = ++sessionRef.current;

    async function stopScanner() {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (!scanner) {
        if (!cancelled && session === sessionRef.current) {
          setRunning(false);
        }
        return;
      }
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch {
        // ignore
      }
      try {
        scanner.clear();
      } catch {
        // ignore
      }
      if (!cancelled && session === sessionRef.current) {
        setRunning(false);
      }
    }

    async function startScanner() {
      handlingRef.current = false;
      if (!cancelled) setError(null);
      await stopScanner();
      if (cancelled || session !== sessionRef.current) return;

      const el = document.getElementById(regionId);
      if (!el) {
        setError("Không tìm thấy vùng camera. Thử tải lại trang.");
        onStopRef.current?.();
        return;
      }
      // html5-qrcode cần element trống
      el.innerHTML = "";

      try {
        const scanner = new Html5Qrcode(regionId, { verbose: false });
        scannerRef.current = scanner;

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras.length) {
          throw new Error("Không tìm thấy camera trên thiết bị.");
        }

        const backCam =
          cameras.find((c) => /back|rear|environment|sau/i.test(c.label)) ??
          cameras[cameras.length - 1];

        const config = { fps: 8, qrbox: { width: 240, height: 240 } };

        const onSuccess = (decoded: string) => {
          if (!decoded || handlingRef.current) return;
          if (cancelled || session !== sessionRef.current) return;
          handlingRef.current = true;
          void (async () => {
            await stopScanner();
            if (cancelled) return;
            onStopRef.current?.();
            onScanRef.current(decoded);
          })();
        };

        try {
          await scanner.start(backCam.id, config, onSuccess, () => undefined);
        } catch {
          // Fallback: facingMode nếu start bằng deviceId thất bại
          await scanner.start(
            { facingMode: "environment" },
            config,
            onSuccess,
            () => undefined,
          );
        }

        if (cancelled || session !== sessionRef.current) {
          await stopScanner();
          return;
        }
        setRunning(true);
      } catch (err) {
        if (cancelled || session !== sessionRef.current) return;
        const detail = err instanceof Error ? err.message : "unknown";
        setError(
          `Không mở được camera (${detail}). Cấp quyền camera, dùng HTTPS, hoặc nhập MSSV.`,
        );
        setRunning(false);
        scannerRef.current = null;
        onStopRef.current?.();
      }
    }

    if (active) {
      void startScanner();
    } else {
      void stopScanner();
    }

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [active, regionId]);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-[var(--line)] bg-black/90 min-h-[260px]">
        {/* Element dành riêng cho html5-qrcode — không nhét overlay vào trong */}
        <div id={regionId} className="min-h-[260px] w-full" />
        {!running ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-white/70">
            Camera đang tắt. Bấm &quot;Bật camera&quot; để quét.
          </div>
        ) : null}
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
