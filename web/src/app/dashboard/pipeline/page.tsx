"use client";

import { useState } from "react";
import { Zap, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function DashboardPipeline() {
  const [status, setStatus] = useState<
    "idle" | "triggering" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const triggerPipeline = async () => {
    setStatus("triggering");
    setMessage("");

    try {
      const res = await fetch("/api/pipeline/trigger", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Pipeline triggered successfully. Check GitHub Actions for progress.");
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to trigger pipeline");
      }
    } catch {
      setStatus("error");
      setMessage("Network error");
    }
  };

  return (
    <div>
      <h1 className="font-[var(--font-instrument-serif)] text-3xl mb-6">
        Pipeline
      </h1>

      <div className="glass rounded-xl p-6 max-w-lg">
        <h3 className="text-sm font-semibold mb-2">Trigger Digest Run</h3>
        <p className="text-sm text-[var(--muted)] mb-4">
          Manually trigger the digest pipeline via GitHub Actions workflow
          dispatch. This will fetch new articles, generate summaries, and send
          the email digest.
        </p>

        <button
          onClick={triggerPipeline}
          disabled={status === "triggering"}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--background)] font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
        >
          {status === "triggering" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Zap size={16} />
          )}
          {status === "triggering" ? "Triggering..." : "Run Pipeline Now"}
        </button>

        {message && (
          <div
            className={`flex items-center gap-2 mt-4 text-sm ${
              status === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {status === "success" ? (
              <CheckCircle size={16} />
            ) : (
              <XCircle size={16} />
            )}
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
