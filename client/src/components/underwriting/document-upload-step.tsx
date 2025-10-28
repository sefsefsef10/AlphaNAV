import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface DocumentUploadStepProps {
  sessionId?: string;
  onNext: () => void;
}

interface UploadedFile {
  name: string;
  size: number;
  status: "uploading" | "completed" | "error";
  progress: number;
}

export default function DocumentUploadStep({ sessionId, onNext }: DocumentUploadStepProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [fundName, setFundName] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: { fundName: string }) => {
      return await apiRequest("POST", "/api/underwriting/sessions", data);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Session Created",
        description: `Started underwriting for ${fundName}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/underwriting/sessions"] });
      // Navigate to the new session page
      if (data.id) {
        setLocation(`/operations/underwriting/${data.id}`);
      } else {
        onNext();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Upload documents mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", `/api/underwriting/sessions/${sessionId}/documents`, formData);
    },
    onSuccess: () => {
      toast({
        title: "Documents Uploaded",
        description: "AI extraction will begin shortly",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/underwriting/sessions", sessionId] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFiles = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map(file => ({
      name: file.name,
      size: file.size,
      status: "uploading",
      progress: 0,
    }));
    
    setFiles(prev => [...prev, ...uploadedFiles]);

    // Simulate upload progress
    uploadedFiles.forEach((_, index) => {
      simulateUpload(files.length + index);
    });
  };

  const simulateUpload = (index: number) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setFiles(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index].progress = Math.min(progress, 100);
          if (progress >= 100) {
            updated[index].status = "completed";
          }
        }
        return updated;
      });
      
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 200);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleSubmit = async () => {
    // Only require fund name for new sessions
    if (!sessionId && !fundName) {
      toast({
        title: "Fund Name Required",
        description: "Please enter a fund name to continue",
        variant: "destructive",
      });
      return;
    }

    if (!sessionId) {
      // Create new session - navigation will happen in onSuccess
      await createSessionMutation.mutateAsync({ fundName });
    } else {
      // Existing session - just proceed to next step
      onNext();
    }
  };

  const allFilesCompleted = files.length > 0 && files.every(f => f.status === "completed");

  return (
    <div className="space-y-6">
      {/* Fund Name Input */}
      {!sessionId && (
        <Card>
          <CardHeader>
            <CardTitle>Fund Information</CardTitle>
            <CardDescription>Enter the fund name to begin underwriting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="fundName">Fund Name</Label>
              <Input
                id="fundName"
                placeholder="e.g., Example Capital Fund III"
                value={fundName}
                onChange={(e) => setFundName(e.target.value)}
                data-testid="input-fund-name"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload PPM, financials, fund agreement, portfolio lists, and other relevant documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={`border-2 border-dashed rounded-md p-12 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            data-testid="dropzone-documents"
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {isDragging ? "Drop files here" : "Drag and drop files here"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse (PDF, Excel, Word - max 50MB each)
            </p>
            <Input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => {
                if (e.target.files) {
                  handleFiles(Array.from(e.target.files));
                }
              }}
              className="hidden"
              id="file-upload"
              data-testid="input-file-upload"
            />
            <Button asChild variant="outline" data-testid="button-browse">
              <label htmlFor="file-upload" className="cursor-pointer">
                Browse Files
              </label>
            </Button>
          </div>

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-semibold text-sm">Uploaded Documents ({files.length})</h4>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-md border"
                  data-testid={`file-item-${index}`}
                >
                  <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      {file.status === "uploading" && (
                        <Progress value={file.progress} className="h-1 flex-1 max-w-32" />
                      )}
                    </div>
                  </div>
                  {file.status === "completed" && (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                  {file.status === "uploading" && (
                    <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                  )}
                  {file.status === "error" && (
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    data-testid={`button-remove-${index}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={(!sessionId && !fundName) || createSessionMutation.isPending}
              data-testid="button-continue"
            >
              {createSessionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Continue to AI Extraction
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Helpful Tips */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Recommended Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Private Placement Memorandum (PPM)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Latest fund financial statements (Balance Sheet, P&L)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Fund Agreement (LPA or Limited Partnership Agreement)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Portfolio company list with valuations</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>GP track record summary (prior fund performance)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
