"use client";

import { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

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
      <main className="max-w-lg mx-auto px-6 py-20">
        <div className="glass rounded-2xl p-8 text-center">
          <h1 className="font-[var(--font-instrument-serif)] text-3xl mb-3">
            Stay in the loop
          </h1>
          <p className="text-sm text-[var(--muted)] mb-8">
            Get curated AI news delivered to your inbox daily. Scored, summarized,
            and ready to read.
          </p>

          {status === "success" ? (
            <div className="glass rounded-xl p-6 border-l-4 border-l-emerald-500">
              <p className="text-emerald-400 font-medium">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg glass text-sm outline-none focus:border-[var(--accent)] transition-colors"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full px-4 py-3 rounded-lg bg-[var(--accent)] text-[var(--background)] font-semibold text-sm hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
              >
                {status === "loading" ? "Subscribing..." : "Subscribe"}
              </button>
              {status === "error" && (
                <p className="text-red-400 text-sm">{message}</p>
              )}
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
