"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { ToastPayload } from "@/utils/pushManager";

export type { ToastPayload };

const AUTO_DISMISS_MS = 9000;

interface ContainerProps {
  toasts: ToastPayload[];
  onDismiss: (id: number) => void;
}

export function NotificationToastContainer({ toasts, onDismiss }: ContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastPayload; onDismiss: (id: number) => void }) {
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(intervalRef.current!);
        onDismiss(toast.id);
      }
    }, 40);
    return () => clearInterval(intervalRef.current!);
  }, [toast.id, onDismiss]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hrs = minutes / 60;
    return hrs === Math.floor(hrs) ? `${hrs}h` : `${hrs.toFixed(1)}h`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="pointer-events-auto w-[310px] rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: "rgba(12, 12, 12, 0.88)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Gradient accent bar */}
      <div
        className="h-[3px] w-full"
        style={{ background: `linear-gradient(90deg, ${toast.beforeColor}, ${toast.afterColor})` }}
      />

      <div className="px-4 pt-3 pb-4">
        {/* Label */}
        <p className="text-[10px] font-medium tracking-widest uppercase mb-2.5"
          style={{ color: "rgba(255,255,255,0.3)" }}>
          {toast.label}
        </p>

        {/* Task row */}
        <div className="flex items-center gap-3 mb-3.5">
          {/* Emoji badge */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
            style={{
              background: `linear-gradient(135deg, ${toast.beforeColor}28, ${toast.afterColor}28)`,
              border: `1px solid ${toast.beforeColor}30`,
            }}
          >
            {toast.emoji}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight truncate">
              {toast.taskName}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              {formatDuration(toast.duration)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onDismiss(toast.id)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-black transition-all duration-150 active:scale-95 hover:brightness-110"
            style={{
              background: `linear-gradient(135deg, ${toast.beforeColor}, ${toast.afterColor})`,
            }}
          >
            Start now
          </button>
          <button
            onClick={() => onDismiss(toast.id)}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 active:scale-95 hover:bg-white/10"
            style={{
              color: "rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            Later
          </button>
        </div>

        {/* Progress bar */}
        <div
          className="mt-3 h-[2px] rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${toast.beforeColor}, ${toast.afterColor})`,
              transition: "width 40ms linear",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
