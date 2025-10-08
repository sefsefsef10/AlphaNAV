import { Calendar, Download, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function ReportsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Generate quarterly reports for LPs and investment committees
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Generate New Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="report-type">Report Type</Label>
                <Select defaultValue="quarterly">
                  <SelectTrigger id="report-type" data-testid="select-report-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quarterly">Quarterly LP Report</SelectItem>
                    <SelectItem value="ic">IC Performance Report</SelectItem>
                    <SelectItem value="portfolio">Portfolio Summary</SelectItem>
                    <SelectItem value="compliance">Compliance Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Reporting Period</Label>
                <Select defaultValue="q2-2024">
                  <SelectTrigger id="period" data-testid="select-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="q2-2024">Q2 2024</SelectItem>
                    <SelectItem value="q1-2024">Q1 2024</SelectItem>
                    <SelectItem value="q4-2023">Q4 2023</SelectItem>
                    <SelectItem value="q3-2023">Q3 2023</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Include Sections</Label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border" />
                  <span className="text-sm">Executive Summary</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border" />
                  <span className="text-sm">Portfolio Performance</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border" />
                  <span className="text-sm">Deal Activity</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border" />
                  <span className="text-sm">Risk Analysis</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-border" />
                  <span className="text-sm">Market Outlook</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border" />
                  <span className="text-sm">Fundraising Metrics</span>
                </label>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="flex-1" data-testid="button-preview-report">
                <FileText className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button className="flex-1" data-testid="button-generate-report">
                <Download className="mr-2 h-4 w-4" />
                Generate PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover-elevate cursor-pointer">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Q2 2024 LP Report</p>
                  <p className="text-xs text-muted-foreground">Generated Jun 30, 2024</p>
                </div>
                <Badge variant="outline" className="bg-success/20 text-success border-success/50">
                  Final
                </Badge>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover-elevate cursor-pointer">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Q1 2024 IC Report</p>
                  <p className="text-xs text-muted-foreground">Generated Mar 31, 2024</p>
                </div>
                <Badge variant="outline" className="bg-success/20 text-success border-success/50">
                  Final
                </Badge>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover-elevate cursor-pointer">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Portfolio Summary</p>
                  <p className="text-xs text-muted-foreground">Generated Jun 15, 2024</p>
                </div>
                <Badge variant="outline">Draft</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reports Generated</span>
                <span className="text-sm font-mono font-medium">47</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Quarter</span>
                <span className="text-sm font-mono font-medium">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Time Saved</span>
                <span className="text-sm font-mono font-medium text-success">4.5 hrs</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
