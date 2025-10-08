import { PortfolioChart } from "../portfolio-chart";

const data = [
  { month: "Jan", portfolio: 250, deployed: 180 },
  { month: "Feb", portfolio: 280, deployed: 210 },
  { month: "Mar", portfolio: 320, deployed: 250 },
  { month: "Apr", portfolio: 380, deployed: 300 },
  { month: "May", portfolio: 420, deployed: 340 },
  { month: "Jun", portfolio: 480, deployed: 390 },
];

export default function PortfolioChartExample() {
  return <PortfolioChart data={data} />;
}
