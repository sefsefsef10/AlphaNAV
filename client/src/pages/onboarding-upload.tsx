import { useState, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { Upload, FileText, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { UploadedDocument } from "@shared/schema";

export default function OnboardingUpload() {
  const [, params] = useRoute("/onboarding/:id/upload");
  const sessionId = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: documents = [], isLoading } = useQuery<UploadedDocument[]>({
    queryKey: ["/api/onboarding/sessions", sessionId, "documents"],
    enabled: !!sessionId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/onboarding/sessions/${sessionId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/sessions", sessionId, "documents"] });
      toast({
        title: "Upload Successful",
        description: "Your document is being processed with AI.",
      });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/onboarding/sessions/${sessionId}/analyze`);
      return await response.json();
    },
    onSuccess: () => {
      setLocation(`/onboarding/${sessionId}/review`);
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "We couldn't analyze your documents. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, Word, or Excel files only.",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload files smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const allDocsProcessed = documents.length > 0 && documents.every(
    (doc) => doc.processingStatus === "completed" || doc.processingStatus === "failed"
  );

  const hasCompletedDocs = documents.some((doc) => doc.processingStatus === "completed");
  
  const hasProcessingDocs = documents.some((doc) => doc.processingStatus === "processing");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Upload Documents
          </h1>
          <p className="text-lg text-muted-foreground">
            Our AI will extract fund information automatically
          </p>
        </div>

        <OnboardingProgress currentStep={2} />

        <div className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
              <CardDescription>
                Upload your fund documents (LPA, NAV reports, portfolio lists). PDF, Word, and Excel files accepted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-md p-8 text-center transition-colors ${
                  isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                data-testid="upload-dropzone"
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  Drag and drop files here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  data-testid="button-select-file"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Select File"
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xlsx,.xls"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  data-testid="input-file-upload"
                />
                <p className="text-xs text-muted-foreground mt-4">
                  Supported: PDF, Word, Excel (max 10MB)
                </p>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading documents...</span>
                </div>
              )}

              {documents.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold text-sm">Uploaded Documents</h3>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                      data-testid={`document-${doc.id}`}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {doc.processingStatus === "processing" && (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="text-xs text-muted-foreground">Processing...</span>
                          </>
                        )}
                        {doc.processingStatus === "completed" && (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-xs text-green-600 dark:text-green-400">Completed</span>
                          </>
                        )}
                        {doc.processingStatus === "failed" && (
                          <>
                            <XCircle className="h-5 w-5 text-destructive" />
                            <span className="text-xs text-destructive">Failed</span>
                          </>
                        )}
                        {doc.processingStatus === "pending" && (
                          <>
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                            <span className="text-xs text-yellow-600 dark:text-yellow-400">Pending</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {documents.length > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => analyzeMutation.mutate()}
                    disabled={analyzeMutation.isPending || !hasCompletedDocs || hasProcessingDocs}
                    className="flex-1"
                    data-testid="button-analyze-documents"
                  >
                    {analyzeMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing with AI...
                      </>
                    ) : hasProcessingDocs ? (
                      "Processing documents..."
                    ) : hasCompletedDocs ? (
                      "Continue to Review"
                    ) : (
                      "Waiting for completed documents"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending || hasProcessingDocs}
                    data-testid="button-upload-more"
                  >
                    Upload More Documents
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Document Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Upload your fund documents for our team to review:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Latest NAV or quarterly report</li>
                <li>Limited Partnership Agreement (LPA)</li>
                <li>Portfolio company list</li>
                <li>Recent financial statements</li>
              </ul>
              <p className="mt-4 text-xs">
                You'll enter key fund information in the next step, then our team will review your documents and reach out within 48 hours.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
