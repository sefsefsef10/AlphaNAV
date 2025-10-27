import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BatchUpload {
  id: string;
  uploadedBy: string;
  sessionId: string | null;
  facilityId: string | null;
  prospectId: string | null;
  totalFiles: number;
  processedFiles: number;
  status: string;
  createdAt: string;
}

interface BatchJob {
  id: string;
  batchId: string;
  documentId: string;
  status: string;
  priority: number;
  errorMessage: string | null;
}

export default function BatchUploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Fetch recent batches
  const { data: batches = [], isLoading: batchesLoading, error: batchesError } = useQuery<BatchUpload[]>({
    queryKey: ["/api/documents/batch/recent"],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append("files", file));
      formData.append("sessionId", "batch-upload-session");

      const response = await fetch("/api/documents/batch", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload successful",
        description: `${selectedFiles.length} files uploaded and processing started`,
      });
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ["/api/documents/batch/recent"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      await uploadMutation.mutateAsync(selectedFiles);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing": return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "failed": return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "processing": return "secondary";
      case "failed": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Batch Document Upload</h1>
        <p className="text-muted-foreground">
          Upload multiple documents for AI-powered extraction and processing
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Select multiple PDF or DOCX files for batch processing. Maximum 50 files, 50MB each.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate">
            <input
              type="file"
              multiple
              accept=".pdf,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              data-testid="input-file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm font-medium">Click to select files</p>
              <p className="text-xs text-muted-foreground">PDF or DOCX, up to 50MB each</p>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{selectedFiles.length} files selected</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="truncate max-w-md">{file.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      data-testid={`button-remove-file-${index}`}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
            className="w-full"
            data-testid="button-upload-batch"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Batches */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Batches</CardTitle>
          <CardDescription>View status of recent batch uploads</CardDescription>
        </CardHeader>
        <CardContent>
          {batchesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : batchesError ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive">Failed to load batches</p>
              <p className="text-xs text-muted-foreground mt-1">
                {batchesError instanceof Error ? batchesError.message : "Unknown error"}
              </p>
            </div>
          ) : batches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No batches uploaded yet
            </p>
          ) : (
            <div className="space-y-3">
              {batches.map((batch) => {
                const progress = batch.totalFiles > 0
                  ? (batch.processedFiles / batch.totalFiles) * 100
                  : 0;

                return (
                  <Card key={batch.id} className="p-4" data-testid={`batch-${batch.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(batch.status)}
                          <span className="font-medium text-sm">Batch {batch.id.slice(0, 8)}</span>
                          <Badge variant={getStatusColor(batch.status) as any}>
                            {batch.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(batch.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">
                          {batch.processedFiles} / {batch.totalFiles} files
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {progress.toFixed(0)}% complete
                        </p>
                      </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
