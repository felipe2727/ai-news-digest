"use client";

import type { Subscriber } from "@/lib/types";

export default function SubscribersTable({
  subscribers,
}: {
  subscribers: Subscriber[];
}) {
  const handleExportCSV = () => {
    const header = "email,confirmed,created_at,confirmed_at\n";
    const rows = subscribers
      .map(
        (s) =>
          `${s.email},${s.confirmed},${s.created_at},${s.confirmed_at || ""}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 text-sm rounded-lg glass hover:bg-white/[0.06] transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] text-left text-[var(--muted)]">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium w-28">Status</th>
                <th className="px-4 py-3 font-medium w-36">Subscribed</th>
                <th className="px-4 py-3 font-medium w-36">Confirmed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                        s.confirmed
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {s.confirmed ? "Confirmed" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {s.confirmed_at
                      ? new Date(s.confirmed_at).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
              {subscribers.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-[var(--muted)]"
                  >
                    No subscribers yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
