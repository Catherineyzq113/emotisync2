import { useVoice } from "@humeai/voice-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/button";
import { Phone } from "lucide-react";
import { useState } from "react";

export default function StartCall() {
  const { status, connect, setVolume } = useVoice();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (isConnecting || status.value === "connecting" || status.value === "error") return;

    setIsConnecting(true);
    console.log("Start Call button clicked...");

    try {
      console.log("Attempting to connect to EVI model...");

      const connection = await connect();

      setVolume(0)

      // Try to mute all audio elements created by Hume
      const audios = document.querySelectorAll('audio');
      audios.forEach((audio) => {
        audio.muted = true;
      });


      console.log("Voice connection successful!", connection);
      //alert("Call started successfully!");

    } catch (err) {
      // ✅ Ensure error is of type `Error`
      const error = err as Error;
      console.error("Call connection failed:", error);
      alert(`Failed to start the call. Error: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <AnimatePresence>
      {status.value !== "connected" && status.value !== "error" && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-background p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.5 }}
          >
            <Button
              className="z-50 flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600 transition"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              <Phone className="size-4 opacity-50" strokeWidth={2} stroke="currentColor" />
              <span>{isConnecting ? "Connecting..." : "Start Call"}</span>
            </Button>
          </motion.div>
        </motion.div>
      )}

      {status.value === 'connected' ? 'Connected!' : "not connected"}
    </AnimatePresence>
  );
}
