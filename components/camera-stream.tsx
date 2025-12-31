"use client";

import { useState, useEffect } from "react";
import { Video, VideoOff, Loader2 } from "lucide-react";

interface CameraStreamProps {
  rtspUrl: string;
  cameraId?: string;
  className?: string;
}

export function CameraStream({ rtspUrl, cameraId, className }: CameraStreamProps) {
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (cameraId) {
      const updateFrame = () => {
        setFrameUrl(`/api/cameras/${cameraId}/frame/?t=${Date.now()}`);
        setIsLoading(false);
      };
      
      updateFrame();
      const interval = setInterval(updateFrame, 2000); // Polling every 2 seconds to reduce load
      return () => clearInterval(interval);
    } else {
      setError("Camera ID missing");
      setIsLoading(false);
    }
  }, [cameraId]);

  return (
    <div className={`relative w-full h-full bg-neutral-950 flex items-center justify-center overflow-hidden ${className}`}>
      {frameUrl ? (
        <img
          src={frameUrl}
          alt="Camera Feed"
          className="w-full h-full object-cover absolute inset-0"
          onError={() => {
            setError("Stream unavailable");
          }}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 z-10">
          <VideoOff className="w-10 h-10 text-neutral-800" />
          <span className="text-[10px] font-mono text-neutral-700 tracking-widest uppercase">
            {error || "No Signal"}
          </span>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center gap-3 z-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">
            Connecting to Stream...
          </span>
        </div>
      )}
      
      {/* Scanning Lines Effect Overlay (only if not error) */}
      {!error && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-30" />
      )}
    </div>
  );
}

