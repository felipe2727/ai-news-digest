"use client";

import { FileText, Users, Layers, MousePointerClick } from "lucide-react";

interface Stats {
  totalArticles: number;
  totalSubscribers: number;
  totalDigests: number;
  clicksLast30d: number;
}

const cards = [
  { key: "totalArticles" as const, label: "Articles", icon: FileText },
  { key: "totalSubscribers" as const, label: "Subscribers", icon: Users },
  { key: "totalDigests" as const, label: "Digests", icon: Layers },
  {
    key: "clicksLast30d" as const,
    label: "Clicks (30d)",
    icon: MousePointerClick,
  },
];

export default function StatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map(({ key, label, icon: Icon }) => (
        <div key={key} className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Icon size={18} className="text-[var(--accent)]" />
            <span className="text-xs text-[var(--muted)] uppercase tracking-wider">
              {label}
            </span>
          </div>
          <p className="text-2xl font-semibold font-[var(--font-dm-mono)]">
            {stats[key].toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
