import { HealthScoreCard, HealthMetric } from "../health-score-card";

const mockMetrics: HealthMetric[] = [
  {
    id: "1",
    dealName: "Sequoia Capital Fund XII",
    score: 85,
    trend: "up",
    category: "excellent",
    lastUpdate: "Updated 2 hours ago",
  },
  {
    id: "2",
    dealName: "Tiger Global Private Investment",
    score: 72,
    trend: "stable",
    category: "good",
    lastUpdate: "Updated 5 hours ago",
  },
];

export default function HealthScoreCardExample() {
  return <HealthScoreCard metrics={mockMetrics} />;
}
