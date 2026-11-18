'use client';

import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface CameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

export default function CameraScanner({ onScanSuccess }: CameraScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'rotaex-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        rememberLastUsedCamera: true,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
      },
      () => {
        // Ignora frames sem código detectado
      }
    );

    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [onScanSuccess]);

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-500/40 bg-black p-2">
      <div id="rotaex-reader" className="w-full text-xs text-slate-300" />
    </div>
  );
}