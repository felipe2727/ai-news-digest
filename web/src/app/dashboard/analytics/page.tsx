import { getPageViewsOverTime } from "@/lib/admin-queries";
import AnalyticsCharts from "./AnalyticsCharts";

export default async function DashboardAnalytics() {
  const pageViews = await getPageViewsOverTime();

  return (
    <div>
      <h1 className="font-[var(--font-instrument-serif)] text-3xl mb-6">
        Analytics
      </h1>

      <AnalyticsCharts pageViews={pageViews} />
    </div>
  );
}
