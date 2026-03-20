"use client";
import { Hume } from "hume";
import { useVoice } from "@humeai/voice-react";
import { expressionColors, isExpressionColor } from "@/utils/expressionColors";
import { motion } from "framer-motion";
import { CSSProperties } from "react";
import * as R from "remeda";

export default function Messages({
  values,
}: {
  values: Record<string, number> | undefined;
}) {
  if (!values) {
    return (
      <div className="p-4 text-gray-500">Waiting for emotion scores...</div>
    );
  }

  const top3 = Object.entries(values)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div
      className={
        "text-xs p-3 w-full border-t border-border flex flex-col md:flex-row gap-3"
      }
    >
      {top3.map(([key, value]) => (
        <div key={key} className={"w-full overflow-hidden"}>
          <div
            className={"flex items-center justify-between gap-1 font-mono pb-1"}
          >
            <div className={"font-medium truncate"}>{key}</div>
            <div className={"tabular-nums opacity-50"}>
              {value.toFixed(2)}
            </div>
          </div>
          <div
            className={"relative h-1"}
            style={
              {
                "--bg": isExpressionColor(key)
                  ? expressionColors[key]
                  : "var(--bg)",
              } as CSSProperties
            }
          >
            <div
              className={
                "absolute top-0 left-0 size-full rounded-full opacity-10 bg-[var(--bg)]"
              }
            />
            <motion.div
  className={
    "absolute top-0 left-0 h-full bg-[var(--bg)] rounded-full"
  }
  initial={{ width: 0 }}
  animate={{
    width: `${Math.min(1, Math.max(0, value)) * 100}%`
  }}
/>

          </div>
        </div>
      ))}
    </div>
  );
}
