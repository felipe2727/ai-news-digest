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
    // If navigating to the latest, remove the param
    if (date === availableDates[0]) {
      router.push("/");
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", date);
      router.push(`/?${params.toString()}`);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate(olderDate)}
        disabled={!olderDate}
        className="text-sm px-3 py-1.5 rounded-lg glass disabled:opacity-30 disabled:cursor-not-allowed hover:text-[var(--accent)] transition-colors"
        aria-label="Older digest"
      >
        &larr; Older
      </button>

      <select
        value={currentDate}
        onChange={(e) => navigate(e.target.value)}
        className="text-sm px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] cursor-pointer"
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
        className="text-sm px-3 py-1.5 rounded-lg glass disabled:opacity-30 disabled:cursor-not-allowed hover:text-[var(--accent)] transition-colors"
        aria-label="Newer digest"
      >
        Newer &rarr;
      </button>
    </div>
  );
}
