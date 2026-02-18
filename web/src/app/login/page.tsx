"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/shared/Navbar";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setStatus(error ? "error" : "sent");
  };

  const handleGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <>
      <Navbar />
      <main className="max-w-sm mx-auto px-6 py-20">
        <div className="glass rounded-2xl p-8">
          <h1 className="font-[var(--font-instrument-serif)] text-2xl mb-6 text-center">
            Sign in
          </h1>

          {status === "sent" ? (
            <div className="text-center text-sm text-emerald-400">
              Check your email for the magic link.
            </div>
          ) : (
            <>
              <form onSubmit={handleMagicLink} className="flex flex-col gap-3 mb-6">
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg glass text-sm outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--accent)] text-[var(--background)] font-semibold text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  {status === "loading" ? "Sending..." : "Sign in with magic link"}
                </button>
              </form>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border)]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[var(--surface)] px-2 text-[var(--muted)]">or</span>
                </div>
              </div>

              <button
                onClick={handleGitHub}
                className="w-full px-4 py-3 rounded-lg glass font-medium text-sm hover:bg-[var(--surface-hover)] transition-colors"
              >
                Sign in with GitHub
              </button>
            </>
          )}

          {status === "error" && (
            <p className="text-red-400 text-sm mt-4 text-center">
              Something went wrong. Please try again.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
