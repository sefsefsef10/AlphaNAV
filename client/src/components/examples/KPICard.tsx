import { KPICard } from "../kpi-card";
import { DollarSign } from "lucide-react";

export default function KPICardExample() {
  return <KPICard title="Total Portfolio" value="$480M" change={12.5} icon={DollarSign} />;
}
