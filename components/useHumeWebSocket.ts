import { useEffect, useState } from "react";

export default function useHumeWebSocket(apiKey: string) {
  const [emotionScores, setEmotionScores] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`wss://api.hume.ai/v0/stream/models?apikey=${apiKey}`);

    ws.onopen = () => {
      console.log("✅ WebSocket opened");

      const startMessage = {
        models: {
          prosody: {}
        },
        config: {
          audio: {
            encoding: "linear16",
            sampleRateHertz: 16000,
            channels: 1
          }
        }
      };

      ws.send(JSON.stringify(startMessage));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message?.models?.prosody?.scores) {
        setEmotionScores(message.models.prosody.scores);
      }
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, [apiKey]);

  return { emotionScores };
}
