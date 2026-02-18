import { getSubscribers } from "@/lib/admin-queries";
import SubscribersTable from "./SubscribersTable";

export default async function DashboardSubscribers() {
  const { subscribers, total } = await getSubscribers();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-[var(--font-instrument-serif)] text-3xl">
          Subscribers
        </h1>
        <span className="text-sm text-[var(--muted)]">
          {total.toLocaleString()} total
        </span>
      </div>

      <SubscribersTable subscribers={subscribers} />
    </div>
  );
}
