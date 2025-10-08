import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type DealStatus = "lead" | "underwriting" | "approved" | "monitoring" | "closed";

export interface Deal {
  id: string;
  fundName: string;
  status: DealStatus;
  amount: number;
  stage: string;
  lastUpdate: string;
  riskScore?: number;
}

const statusStyles = {
  lead: "bg-muted text-muted-foreground",
  underwriting: "bg-warning/20 text-warning border-warning/50",
  approved: "bg-success/20 text-success border-success/50",
  monitoring: "bg-primary/20 text-primary border-primary/50",
  closed: "bg-secondary text-secondary-foreground",
};

interface DealTableProps {
  deals: Deal[];
  onViewDeal?: (id: string) => void;
  onEditDeal?: (id: string) => void;
}

export function DealTable({ deals, onViewDeal, onEditDeal }: DealTableProps) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[250px]">
              <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2">
                Fund Name
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2">
                Amount
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Risk Score</TableHead>
            <TableHead>Last Update</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <TableRow key={deal.id} className="hover-elevate" data-testid={`row-deal-${deal.id}`}>
              <TableCell className="font-medium">{deal.fundName}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("border", statusStyles[deal.status])}>
                  {deal.status}
                </Badge>
              </TableCell>
              <TableCell className="font-mono tabular-nums">
                ${(deal.amount / 1000000).toFixed(1)}M
              </TableCell>
              <TableCell className="text-muted-foreground">{deal.stage}</TableCell>
              <TableCell>
                {deal.riskScore !== undefined && (
                  <span className={cn("font-mono tabular-nums font-medium", {
                    "text-success": deal.riskScore <= 3,
                    "text-warning": deal.riskScore > 3 && deal.riskScore <= 6,
                    "text-danger": deal.riskScore > 6,
                  })}>
                    {deal.riskScore}/10
                  </span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{deal.lastUpdate}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid={`button-deal-menu-${deal.id}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDeal?.(deal.id)}>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditDeal?.(deal.id)}>
                      Edit Deal
                    </DropdownMenuItem>
                    <DropdownMenuItem>Generate Report</DropdownMenuItem>
                    <DropdownMenuItem className="text-danger">Archive Deal</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
