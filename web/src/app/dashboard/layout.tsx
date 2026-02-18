"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Zap,
  BarChart3,
  ArrowLeft,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/articles", label: "Articles", icon: FileText },
  { href: "/dashboard/subscribers", label: "Subscribers", icon: Users },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: Zap },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-white/[0.07] p-4 flex flex-col gap-1 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-4 px-3"
        >
          <ArrowLeft size={14} />
          Back to site
        </Link>

        <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] px-3 mb-2">
          Admin
        </p>

        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-white/[0.07] text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04]"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
