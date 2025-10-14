import { useState } from "react";
import { DollarSign, TrendingUp, Calendar, MessageSquare, Download, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Loan {
  id: string;
  dealName: string;
  fundName: string;
  principalAmount: number;
  outstandingBalance: number;
  interestRate: number;
  maturityDate: string;
  status: "current" | "prepaid" | "extended";
  ltv: number;
  paymentSchedule: "quarterly" | "semi-annual";
}

interface CashFlow {
  date: string;
  principal: number;
  interest: number;
  total: number;
  runningBalance: number;
}

const mockLoans: Loan[] = [
  {
    id: "loan-1",
    dealName: "NAV-001",
    fundName: "Sequoia Capital Fund XII",
    principalAmount: 50000000,
    outstandingBalance: 48500000,
    interestRate: 8.5,
    maturityDate: "2026-12-31",
    status: "current",
    ltv: 45,
    paymentSchedule: "quarterly",
  },
  {
    id: "loan-2",
    dealName: "NAV-002",
    fundName: "Tiger Global Private Investment",
    principalAmount: 35000000,
    outstandingBalance: 35000000,
    interestRate: 9.25,
    maturityDate: "2025-06-30",
    status: "current",
    ltv: 52,
    paymentSchedule: "quarterly",
  },
  {
    id: "loan-3",
    dealName: "NAV-003",
    fundName: "Andreessen Horowitz Bio Fund",
    principalAmount: 25000000,
    outstandingBalance: 0,
    interestRate: 8.0,
    maturityDate: "2024-03-31",
    status: "prepaid",
    ltv: 0,
    paymentSchedule: "semi-annual",
  },
  {
    id: "loan-4",
    dealName: "NAV-004",
    fundName: "Benchmark Capital Growth VI",
    principalAmount: 40000000,
    outstandingBalance: 40000000,
    interestRate: 8.75,
    maturityDate: "2027-03-31",
    status: "current",
    ltv: 48,
    paymentSchedule: "quarterly",
  },
];

const generateCashFlows = (loan: Loan): CashFlow[] => {
  const flows: CashFlow[] = [];
  let balance = loan.outstandingBalance;
  const periods = 8;
  const interestPerPeriod = (loan.interestRate / 100) / 4;
  const principalPerPeriod = loan.outstandingBalance / periods;

  for (let i = 1; i <= periods; i++) {
    const interest = balance * interestPerPeriod;
    const principal = i === periods ? balance : principalPerPeriod;
    balance -= principal;

    flows.push({
      date: `Q${i} 2024-2026`,
      principal: principal,
      interest: interest,
      total: principal + interest,
      runningBalance: balance,
    });
  }
  return flows;
};

export default function PortfolioPage() {
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [lpQuestion, setLpQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const totalPortfolio = mockLoans.reduce((sum, loan) => sum + loan.outstandingBalance, 0);
  const activeLoans = mockLoans.filter(l => l.status === "current").length;
  const avgInterestRate = mockLoans.filter(l => l.status === "current")
    .reduce((sum, l) => sum + l.interestRate, 0) / activeLoans;

  const handleAskQuestion = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAiResponse(`Based on your portfolio analysis:\n\n${lpQuestion}\n\nAnswer: Your current portfolio consists of ${activeLoans} active NAV loans with a total outstanding balance of $${(totalPortfolio / 1000000).toFixed(1)}M. The weighted average interest rate is ${avgInterestRate.toFixed(2)}%. All loans maintain healthy LTV ratios below 55%, with strong covenant compliance. Expected quarterly interest income is approximately $${(totalPortfolio * (avgInterestRate / 100) / 4 / 1000000).toFixed(2)}M. Risk metrics indicate excellent portfolio health with diversification across top-tier GPs.`);
      setIsAnalyzing(false);
    }, 1500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Active Portfolio</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Live loan analytics, amortization schedules, and LP insights
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold font-mono tabular-nums">
                ${(totalPortfolio / 1000000).toFixed(1)}M
              </p>
              <Badge variant="outline" className="bg-success/20 text-success border-success/50">
                {activeLoans} Active
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Avg Interest Rate</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono tabular-nums">{avgInterestRate.toFixed(2)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Quarterly Interest</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono tabular-nums">
              ${(totalPortfolio * (avgInterestRate / 100) / 4 / 1000000).toFixed(2)}M
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Avg LTV</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono tabular-nums">
              {(mockLoans.filter(l => l.status === "current").reduce((sum, l) => sum + l.ltv, 0) / activeLoans).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="loans" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="loans" data-testid="tab-loans">
            <DollarSign className="mr-2 h-4 w-4" />
            Active Loans
          </TabsTrigger>
          <TabsTrigger value="cashflows" data-testid="tab-cashflows">
            <TrendingUp className="mr-2 h-4 w-4" />
            Cash Flows
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <MessageSquare className="mr-2 h-4 w-4" />
            LP Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>Loan Portfolio</CardTitle>
                <Button variant="outline" data-testid="button-export-portfolio">
                  <Download className="mr-2 h-4 w-4" />
                  Export Portfolio
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[120px]">Deal ID</TableHead>
                      <TableHead className="min-w-[200px]">Fund Name</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">LTV</TableHead>
                      <TableHead>Maturity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockLoans.map((loan) => (
                      <TableRow key={loan.id} data-testid={`loan-row-${loan.id}`}>
                        <TableCell className="font-mono font-medium">{loan.dealName}</TableCell>
                        <TableCell>{loan.fundName}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatCurrency(loan.principalAmount)}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatCurrency(loan.outstandingBalance)}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {loan.interestRate.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {loan.ltv}%
                        </TableCell>
                        <TableCell className="font-mono">{loan.maturityDate}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              loan.status === "current"
                                ? "bg-success/20 text-success border-success/50"
                                : loan.status === "prepaid"
                                ? "bg-muted text-muted-foreground border-muted"
                                : "bg-warning/20 text-warning border-warning/50"
                            }
                          >
                            {loan.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLoan(loan)}
                            data-testid={`button-view-loan-${loan.id}`}
                          >
                            View
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {selectedLoan && (
            <Card>
              <CardHeader>
                <CardTitle>Loan Details: {selectedLoan.dealName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fund</p>
                    <p className="font-medium mt-1">{selectedLoan.fundName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Schedule</p>
                    <p className="font-medium mt-1 capitalize">{selectedLoan.paymentSchedule}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interest Type</p>
                    <p className="font-medium mt-1">Simple Interest</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amortization</p>
                    <p className="font-medium mt-1">Straight-Line</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cashflows" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Amortization & Cash Flow Projections</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedLoan ? `${selectedLoan.dealName} - ${selectedLoan.fundName}` : "Select a loan to view cash flows"}
                  </p>
                </div>
                <Button variant="outline" data-testid="button-export-cashflows">
                  <Download className="mr-2 h-4 w-4" />
                  Export Cash Flows
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedLoan ? (
                <div className="rounded-lg border border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Principal</TableHead>
                        <TableHead className="text-right">Interest</TableHead>
                        <TableHead className="text-right">Total Payment</TableHead>
                        <TableHead className="text-right">Remaining Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generateCashFlows(selectedLoan).map((flow, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{flow.date}</TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatCurrency(flow.principal)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatCurrency(flow.interest)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums font-semibold">
                            {formatCurrency(flow.total)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                            {formatCurrency(flow.runningBalance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select a loan from the Active Loans tab to view amortization schedule</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>LP Question Answering</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ask questions about your portfolio and get AI-powered insights
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lp-question">Your Question</Label>
                <Textarea
                  id="lp-question"
                  placeholder="e.g., What is the expected quarterly interest income from my portfolio? What is the risk profile of my current loans?"
                  value={lpQuestion}
                  onChange={(e) => setLpQuestion(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="textarea-lp-question"
                />
              </div>
              <Button
                onClick={handleAskQuestion}
                disabled={!lpQuestion || isAnalyzing}
                className="w-full sm:w-auto"
                data-testid="button-ask-question"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {isAnalyzing ? "Analyzing..." : "Get Answer"}
              </Button>

              {aiResponse && (
                <div className="p-4 rounded-lg bg-muted space-y-2" data-testid="ai-response">
                  <p className="text-sm font-medium">AI Analysis:</p>
                  <p className="text-sm whitespace-pre-line">{aiResponse}</p>
                </div>
              )}

              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm font-medium">Sample Questions:</p>
                <div className="grid gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto p-3 text-left"
                    onClick={() => setLpQuestion("What is my current portfolio diversification and concentration risk?")}
                  >
                    <span className="text-sm">What is my current portfolio diversification and concentration risk?</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto p-3 text-left"
                    onClick={() => setLpQuestion("Which loans have the highest yield and what are their risk metrics?")}
                  >
                    <span className="text-sm">Which loans have the highest yield and what are their risk metrics?</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto p-3 text-left"
                    onClick={() => setLpQuestion("What is the expected IRR across my portfolio?")}
                  >
                    <span className="text-sm">What is the expected IRR across my portfolio?</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
