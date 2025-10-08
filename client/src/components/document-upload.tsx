import { useState, useCallback } from "react";
import { Upload, FileText, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "complete" | "error";
}

interface DocumentUploadProps {
  onUpload?: (files: File[]) => void;
}

export function DocumentUpload({ onUpload }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFiles = (fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: "uploading" as const,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    onUpload?.(fileList);

    // Simulate upload completion
    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f) =>
          newFiles.find((nf) => nf.id === f.id) ? { ...f, status: "complete" as const } : f
        )
      );
    }, 1500);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={cn(
          "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragging ? "border-primary bg-primary/10" : "border-border"
        )}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
          data-testid="input-file-upload"
        />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm font-medium mb-1">
          Drop files here or click to upload
        </p>
        <p className="text-xs text-muted-foreground">
          Supports PDF, DOCX, XLSX (max 50MB per file)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
              data-testid={`file-item-${file.id}`}
            >
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              {file.status === "complete" && (
                <Check className="h-5 w-5 text-success" />
              )}
              {file.status === "uploading" && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(file.id)}
                data-testid={`button-remove-file-${file.id}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
