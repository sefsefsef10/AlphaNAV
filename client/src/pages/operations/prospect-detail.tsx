import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Edit2, Save, X, FileText, Calendar, Building2, Target, MapPin, TrendingUp, Users, DollarSign, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { LTVCalculator } from "@/components/LTVCalculator";
import { EligibilityAssessment } from "@/components/EligibilityAssessment";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ProspectDetailPage() {
  const [, params] = useRoute("/operations/prospects/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({});

  const prospectId = params?.id;

  const { data: prospect, isLoading } = useQuery<any>({
    queryKey: ["/api/prospects", prospectId],
    enabled: !!prospectId,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch(`/api/prospects/${prospectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update prospect");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prospects", prospectId] });
      toast({
        title: "Prospect updated",
        description: "Changes saved successfully",
      });
      setIsEditing(false);
      setEditedData({});
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/prospects/${prospectId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete prospect");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      toast({
        title: "Prospect deleted",
        description: "Prospect has been removed from the pipeline",
      });
      setLocation("/operations/prospects");
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(editedData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const getConfidenceBadge = (confidence: number | null) => {
    if (!confidence) return null;
    if (confidence >= 91) return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">High Confidence</Badge>;
    if (confidence >= 71) return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Medium Confidence</Badge>;
    return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Low Confidence</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Prospect not found</h3>
            <p className="text-muted-foreground mb-4">The prospect you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/operations/prospects")} data-testid="button-back-to-list">
              Back to Prospects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentData = isEditing ? { ...prospect, ...editedData } : prospect;

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/operations/prospects")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-prospect-name">{currentData.fundName}</h1>
            <p className="text-muted-foreground mt-1">
              {currentData.gpFirmName && `${currentData.gpFirmName} • `}
              Added {new Date(currentData.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                data-testid="button-edit"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" data-testid="button-delete">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete prospect?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {currentData.fundName} from your pipeline. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} data-testid="button-confirm-delete">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                data-testid="button-cancel"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                data-testid="button-save"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {currentData.source === "ai_extraction" && (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            AI Extracted
          </Badge>
        )}
        {currentData.extractionConfidence && getConfidenceBadge(currentData.extractionConfidence)}
        <Badge variant="secondary" data-testid="badge-stage">{currentData.stage || "prospect"}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Core Fund Information */}
          <Card>
            <CardHeader>
              <CardTitle>Fund Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fundName">Fund Name</Label>
                  {isEditing ? (
                    <Input
                      id="fundName"
                      value={currentData.fundName}
                      onChange={(e) => setEditedData({ ...editedData, fundName: e.target.value })}
                      data-testid="input-fund-name"
                    />
                  ) : (
                    <div className="text-sm font-medium" data-testid="text-fund-name">{currentData.fundName}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>AUM / Fund Size</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium" data-testid="text-fund-size">
                      {formatCurrency(currentData.fundSize)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Vintage Year</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium" data-testid="text-vintage">
                      {currentData.vintage || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Portfolio Companies</Label>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium" data-testid="text-portfolio-count">
                      {currentData.portfolioCount || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Investment Strategy</Label>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium" data-testid="text-strategy">
                      {currentData.strategy || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Geographic Focus</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium" data-testid="text-geography">
                      {currentData.geography || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {currentData.sectors && currentData.sectors.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Investment Sectors</Label>
                    <div className="flex flex-wrap gap-2">
                      {currentData.sectors.map((sector: string, idx: number) => (
                        <Badge key={idx} variant="outline" data-testid={`badge-sector-${idx}`}>
                          {sector}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* GP Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                General Partner Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>GP Name</Label>
                  <div className="text-sm font-medium" data-testid="text-gp-name">
                    {currentData.gpName || "N/A"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>GP Firm Name</Label>
                  <div className="text-sm font-medium" data-testid="text-gp-firm">
                    {currentData.gpFirmName || "N/A"}
                  </div>
                </div>
              </div>

              {currentData.gpTrackRecord && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Track Record</Label>
                    {isEditing ? (
                      <Textarea
                        value={currentData.gpTrackRecord}
                        onChange={(e) => setEditedData({ ...editedData, gpTrackRecord: e.target.value })}
                        rows={3}
                        data-testid="input-gp-track-record"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground" data-testid="text-gp-track-record">
                        {currentData.gpTrackRecord}
                      </div>
                    )}
                  </div>
                </>
              )}

              {(currentData.contactName || currentData.contactEmail || currentData.contactPhone) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Contact Information</Label>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {currentData.contactName && (
                        <div data-testid="text-contact-name">
                          <span className="font-medium">Name:</span> {currentData.contactName}
                        </div>
                      )}
                      {currentData.contactEmail && (
                        <div data-testid="text-contact-email">
                          <span className="font-medium">Email:</span> {currentData.contactEmail}
                        </div>
                      )}
                      {currentData.contactPhone && (
                        <div data-testid="text-contact-phone">
                          <span className="font-medium">Phone:</span> {currentData.contactPhone}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          {prospect.documents && prospect.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents
                </CardTitle>
                <CardDescription>
                  Uploaded documents and extractions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {prospect.documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                      data-testid={`document-${doc.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{doc.fileName}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(doc.createdAt).toLocaleDateString()} • {(doc.fileSize / 1024).toFixed(0)} KB
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          doc.processingStatus === "completed"
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : doc.processingStatus === "failed"
                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                            : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                        }
                      >
                        {doc.processingStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (1/3) - Analysis Tools */}
        <div className="space-y-6">
          <LTVCalculator fundSize={currentData.fundSize} />
          <EligibilityAssessment prospect={currentData} />
        </div>
      </div>
    </div>
  );
}
