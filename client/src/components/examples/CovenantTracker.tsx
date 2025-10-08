import { CovenantTracker, Covenant } from "../covenant-tracker";

const mockCovenants: Covenant[] = [
  {
    id: "1",
    dealName: "Sequoia Capital Fund XII",
    covenantType: "Debt/EBITDA Ratio",
    threshold: "≤ 3.5x",
    currentValue: "3.2x",
    status: "compliant",
    lastChecked: "2 hours ago",
  },
  {
    id: "2",
    dealName: "Tiger Global Private Investment",
    covenantType: "Interest Coverage",
    threshold: "≥ 2.0x",
    currentValue: "1.8x",
    status: "warning",
    lastChecked: "5 hours ago",
  },
];

export default function CovenantTrackerExample() {
  return <CovenantTracker covenants={mockCovenants} />;
}
