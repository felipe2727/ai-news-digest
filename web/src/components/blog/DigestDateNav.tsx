"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function DigestDateNav({
  currentDate,
  availableDates,
}: {
  currentDate: string;
  availableDates: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentIdx = availableDates.indexOf(currentDate);
  const newerDate = currentIdx > 0 ? availableDates[currentIdx - 1] : null;
  const olderDate =
    currentIdx < availableDates.length - 1
      ? availableDates[currentIdx + 1]
      : null;

  const isLatest = currentIdx === 0 || currentIdx === -1;

  function navigate(date: string | null) {
    if (!date) return;
    if (date === availableDates[0]) {
      router.push("/");
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", date);
      router.push(`/?${params.toString()}`);
    }
  }

  return (
    <div className="flex items-center gap-2 font-mono text-[11px]">
      <button
        onClick={() => navigate(olderDate)}
        disabled={!olderDate}
        className="px-3 py-1.5 border border-border text-muted disabled:opacity-30 disabled:cursor-not-allowed hover:text-primary hover:border-primary/30 transition-colors"
        aria-label="Older digest"
      >
        &larr; older
      </button>

      <select
        value={currentDate}
        onChange={(e) => navigate(e.target.value)}
        className="px-3 py-1.5 bg-surface border border-border text-foreground cursor-pointer"
      >
        {availableDates.map((date) => (
          <option key={date} value={date}>
            {new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </option>
        ))}
      </select>

      <button
        onClick={() => navigate(newerDate)}
        disabled={isLatest}
        className="px-3 py-1.5 border border-border text-muted disabled:opacity-30 disabled:cursor-not-allowed hover:text-primary hover:border-primary/30 transition-colors"
        aria-label="Newer digest"
      >
        newer &rarr;
      </button>
    </div>
  );
}
