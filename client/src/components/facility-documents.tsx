import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

interface FacilityDocument {
  id: string;
  sessionId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string;
  processingStatus: string;
  uploadedAt: string;
}

interface FacilityDocumentsProps {
  facilityId: string;
}

export function FacilityDocuments({ facilityId }: FacilityDocumentsProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  // Query for facility documents
  const { data: documents = [], isLoading } = useQuery<FacilityDocument[]>({
    queryKey: [`/api/facilities/${facilityId}/documents`],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("facilityId", facilityId);

      const response = await fetch("/api/upload-facility-document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/facilities/${facilityId}/documents`],
      });
      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully",
      });
      setUploading(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message,
      });
      setUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return await apiRequest("DELETE", `/api/uploaded-documents/${documentId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/facilities/${facilityId}/documents`],
      });
      toast({
        title: "Document Deleted",
        description: "The document has been removed",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message,
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploading(true);
      uploadMutation.mutate(file);
    }
  };

  const handleDownload = (doc: FacilityDocument) => {
    window.open(doc.storageUrl, "_blank");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "processing":
        return <Clock className="h-4 w-4 text-primary" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-success-foreground";
      case "processing":
        return "bg-primary text-primary-foreground";
      case "failed":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Facility Documents</h3>
          <p className="text-sm text-muted-foreground">
            Upload and manage facility-related documents
          </p>
        </div>
        <div>
          <input
            type="file"
            id="document-upload"
            className="hidden"
            accept=".pdf,.doc,.docx,.xlsx,.xls"
            onChange={handleFileSelect}
            disabled={uploading}
            data-testid="input-upload-document"
          />
          <Button
            onClick={() => document.getElementById("document-upload")?.click()}
            disabled={uploading}
            data-testid="button-upload-document"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">No Documents Yet</h3>
                <p className="text-muted-foreground">
                  Upload facility documents, loan agreements, or other related files
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        documents.map((doc) => (
          <Card key={doc.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{doc.fileName}</CardTitle>
                    <CardDescription>
                      {formatFileSize(doc.fileSize)} •{" "}
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(doc.processingStatus)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(doc.processingStatus)}
                      <span className="capitalize">{doc.processingStatus}</span>
                    </div>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  data-testid={`button-download-${doc.id}`}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate(doc.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-${doc.id}`}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
