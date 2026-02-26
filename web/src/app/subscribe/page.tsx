"use client";

import { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import WindowChrome from "@/components/shared/WindowChrome";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Check your email to confirm your subscription.");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 md:px-6 py-20">
        <WindowChrome filename="subscribe.sh">
          <div className="p-8 text-center">
            <h1 className="serif-headline text-3xl mb-3">Stay in the loop</h1>
            <p className="text-sm font-mono text-muted mb-8">
              Get curated AI news delivered to your inbox daily. Scored,
              summarized, and ready to read.
            </p>

            {status === "success" ? (
              <div className="border border-primary/30 bg-primary/5 p-6">
                <p className="text-primary font-mono text-sm">{message}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-mono text-sm">
                    $
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="enter_email()"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-surface border border-border text-sm font-mono text-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full px-4 py-3 bg-primary text-black font-mono font-bold text-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {status === "loading" ? "Processing..." : "$ subscribe --force"}
                </button>
                {status === "error" && (
                  <p className="text-red-400 text-sm font-mono">{message}</p>
                )}
              </form>
            )}
          </div>
        </WindowChrome>
      </main>
      <Footer />
    </>
  );
}
