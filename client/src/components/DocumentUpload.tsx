import { useState, useCallback } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";

interface DocumentUploadProps {
  onUploadComplete: (result: any) => void;
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setError(null);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("document", selectedFile);

      // Simulate progress since we can't get real progress from fetch
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/prospects/upload-and-extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      const result = await response.json();

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        onUploadComplete(result);
        setSelectedFile(null);
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Fund Document</CardTitle>
        <CardDescription>
          Upload a fund document (PPM, deck, financial statements) to extract key information using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" data-testid="upload-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center transition-colors
            ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
            ${isUploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}
          `}
          data-testid="upload-dropzone"
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.doc,.docx,.xlsx,.xls,.txt"
            onChange={handleFileSelect}
            disabled={isUploading}
            data-testid="input-file-upload"
          />
          
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {selectedFile ? selectedFile.name : "Drop your document here or click to browse"}
            </p>
            <p className="text-sm text-muted-foreground">
              Supports PDF, Word, Excel, and Text files (max 50MB)
            </p>
            {selectedFile && (
              <p className="text-sm text-muted-foreground mt-2">
                {formatFileSize(selectedFile.size)}
              </p>
            )}
          </label>
        </div>

        {selectedFile && !isUploading && (
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg" data-testid="selected-file-info">
            <FileText className="w-8 h-8 text-primary" />
            <div className="flex-1">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
            <Button onClick={handleUpload} data-testid="button-upload">
              Extract Data
            </Button>
          </div>
        )}

        {isUploading && (
          <div className="space-y-2" data-testid="upload-progress">
            <div className="flex justify-between text-sm">
              <span>Processing document...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
            <p className="text-xs text-muted-foreground">
              AI is analyzing your document. This may take 10-30 seconds.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
