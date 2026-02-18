import {
  getDashboardStats,
  getDigestsOverTime,
  getSourceDistribution,
  getTopicDistribution,
} from "@/lib/admin-queries";
import StatsCards from "./components/StatsCards";
import DashboardCharts from "./components/DashboardCharts";

export default async function DashboardOverview() {
  const [stats, digestsOverTime, sources, topics] = await Promise.all([
    getDashboardStats(),
    getDigestsOverTime(),
    getSourceDistribution(),
    getTopicDistribution(),
  ]);

  return (
    <div>
      <h1 className="font-[var(--font-instrument-serif)] text-3xl mb-6">
        Dashboard
      </h1>

      <StatsCards stats={stats} />

      <DashboardCharts
        digestsOverTime={digestsOverTime}
        sources={sources}
        topics={topics}
      />
    </div>
  );
}
