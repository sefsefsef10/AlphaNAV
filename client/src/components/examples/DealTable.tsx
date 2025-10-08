import { DealTable, Deal } from "../deal-table";

const mockDeals: Deal[] = [
  {
    id: "1",
    fundName: "Sequoia Capital Fund XII",
    status: "monitoring",
    amount: 45000000,
    stage: "Post-Close Monitoring",
    lastUpdate: "2 hours ago",
    riskScore: 2,
  },
  {
    id: "2",
    fundName: "Tiger Global Private Investment",
    status: "underwriting",
    amount: 62000000,
    stage: "Due Diligence",
    lastUpdate: "5 hours ago",
    riskScore: 4,
  },
];

export default function DealTableExample() {
  return (
    <DealTable
      deals={mockDeals}
      onViewDeal={(id) => console.log("View:", id)}
      onEditDeal={(id) => console.log("Edit:", id)}
    />
  );
}
