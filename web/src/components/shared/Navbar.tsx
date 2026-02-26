"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Settings } from "lucide-react";

function UTCClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "UTC",
        }) + " UTC"
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="text-[11px] font-mono text-muted tabular-nums">
      {time}
    </span>
  );
}

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-12 flex items-center justify-between">
        {/* Left: status + path */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-[11px] font-mono text-primary">ready</span>
          </div>
          <span className="text-border hidden sm:inline">|</span>
          <Link
            href="/"
            className="text-[11px] font-mono text-muted hover:text-foreground transition-colors hidden sm:inline"
          >
            ~/ai-news-digest
            <span className="animate-pulse text-primary ml-0.5">_</span>
          </Link>
        </div>

        {/* Center: command buttons */}
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1 text-[11px] font-mono text-muted hover:text-primary hover:bg-surface-hover transition-colors"
          >
            <span className="text-primary">$</span> cd /articles
          </Link>
          <Link
            href="/search"
            className="px-3 py-1 text-[11px] font-mono text-muted hover:text-primary hover:bg-surface-hover transition-colors"
          >
            <span className="text-primary">$</span> search --ai
          </Link>
          <Link
            href="/subscribe"
            className="px-3 py-1 text-[11px] font-mono text-muted hover:text-primary hover:bg-surface-hover transition-colors"
          >
            <span className="text-primary">$</span> subscribe --force
          </Link>
        </div>

        {/* Right: clock + settings */}
        <div className="flex items-center gap-3">
          <UTCClock />
          <Link href="/dashboard" aria-label="Settings">
            <Settings size={14} className="text-muted hover:text-foreground transition-colors" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
