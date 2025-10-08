import { RiskAlertPanel, RiskAlert } from "../risk-alert-panel";

const mockAlerts: RiskAlert[] = [
  {
    id: "1",
    dealName: "Lightspeed Venture Partners",
    severity: "critical",
    message: "Debt/EBITDA ratio exceeded covenant threshold",
    timestamp: "1 day ago",
    acknowledged: false,
  },
  {
    id: "2",
    dealName: "Tiger Global Private Investment",
    severity: "high",
    message: "Interest coverage approaching threshold",
    timestamp: "5 hours ago",
    acknowledged: false,
  },
];

export default function RiskAlertPanelExample() {
  return (
    <RiskAlertPanel
      alerts={mockAlerts}
      onAcknowledge={(id) => console.log("Acknowledge:", id)}
      onViewDetails={(id) => console.log("View:", id)}
    />
  );
}
