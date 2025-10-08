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
import { ExternalLink, Send, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FundScore {
  id: string;
  fundName: string;
  fundSize: number;
  stage: string;
  loanNeedScore: number;
  borrowerQualityScore: number;
  engagementScore: number;
  overallScore: number;
  recommendation: "high-priority" | "medium-priority" | "low-priority" | "monitor";
  linkedInUrl?: string;
}

const recommendationConfig = {
  "high-priority": {
    label: "High Priority",
    color: "bg-success/20 text-success border-success/50",
  },
  "medium-priority": {
    label: "Medium Priority",
    color: "bg-warning/20 text-warning border-warning/50",
  },
  "low-priority": {
    label: "Low Priority",
    color: "bg-muted text-muted-foreground border-border",
  },
  "monitor": {
    label: "Monitor",
    color: "bg-primary/20 text-primary border-primary/50",
  },
};

interface FundScoringTableProps {
  funds: FundScore[];
  onEngage?: (id: string) => void;
  onViewLinkedIn?: (url: string) => void;
}

export function FundScoringTable({ funds, onEngage, onViewLinkedIn }: FundScoringTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[250px]">
              <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2">
                Fund Name
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2">
                Fund Size
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2">
                Loan Need
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2">
                Quality
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2">
                Overall
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>Recommendation</TableHead>
            <TableHead className="w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {funds.map((fund) => {
            const config = recommendationConfig[fund.recommendation];
            
            return (
              <TableRow key={fund.id} className="hover-elevate" data-testid={`fund-row-${fund.id}`}>
                <TableCell className="font-medium">{fund.fundName}</TableCell>
                <TableCell className="font-mono tabular-nums">
                  ${(fund.fundSize / 1000000).toFixed(0)}M
                </TableCell>
                <TableCell className="text-muted-foreground">{fund.stage}</TableCell>
                <TableCell>
                  <span className={cn("font-mono tabular-nums font-medium", {
                    "text-success": fund.loanNeedScore >= 8,
                    "text-warning": fund.loanNeedScore >= 5 && fund.loanNeedScore < 8,
                    "text-muted-foreground": fund.loanNeedScore < 5,
                  })}>
                    {fund.loanNeedScore}/10
                  </span>
                </TableCell>
                <TableCell>
                  <span className={cn("font-mono tabular-nums font-medium", {
                    "text-success": fund.borrowerQualityScore >= 8,
                    "text-warning": fund.borrowerQualityScore >= 5 && fund.borrowerQualityScore < 8,
                    "text-muted-foreground": fund.borrowerQualityScore < 5,
                  })}>
                    {fund.borrowerQualityScore}/10
                  </span>
                </TableCell>
                <TableCell>
                  <span className={cn("text-lg font-bold font-mono tabular-nums", {
                    "text-success": fund.overallScore >= 8,
                    "text-warning": fund.overallScore >= 6 && fund.overallScore < 8,
                    "text-muted-foreground": fund.overallScore < 6,
                  })}>
                    {fund.overallScore.toFixed(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("border", config.color)}>
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEngage?.(fund.id)}
                      data-testid={`button-engage-${fund.id}`}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Engage
                    </Button>
                    {fund.linkedInUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewLinkedIn?.(fund.linkedInUrl!)}
                        data-testid={`button-linkedin-${fund.id}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
