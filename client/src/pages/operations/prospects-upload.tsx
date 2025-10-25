import { useState } from "react";
import { useLocation } from "wouter";
import { DocumentUpload } from "@/components/DocumentUpload";
import { ExtractionResults } from "@/components/ExtractionResults";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProspectsUploadPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [isCreatingProspect, setIsCreatingProspect] = useState(false);

  const handleUploadComplete = (result: any) => {
    setExtractionResult(result);
    toast({
      title: "Document processed successfully",
      description: "Review the extracted data and create a prospect.",
    });
  };

  const handleCreateProspect = async (documentId: string, overrides?: any) => {
    setIsCreatingProspect(true);
    try {
      const response = await fetch("/api/prospects/from-extraction", {
        method: "POST",
        body: JSON.stringify({ documentId, overrides }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to create prospect");
      }

      const data = await response.json();

      toast({
        title: "Prospect created successfully",
        description: `${data.prospect.fundName} has been added to your prospects.`,
      });

      // Navigate to the new prospect detail page
      setLocation(`/operations/prospects/${data.prospect.id}`);
    } catch (error) {
      toast({
        title: "Failed to create prospect",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsCreatingProspect(false);
    }
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-8">
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
          <h1 className="text-3xl font-bold">AI Document Extraction</h1>
          <p className="text-muted-foreground mt-1">
            Upload fund documents to automatically extract key information
          </p>
        </div>
      </div>

      {!extractionResult ? (
        <DocumentUpload onUploadComplete={handleUploadComplete} />
      ) : (
        <ExtractionResults
          extraction={extractionResult.extraction}
          documentId={extractionResult.documentId}
          onCreateProspect={handleCreateProspect}
          isCreating={isCreatingProspect}
        />
      )}
    </div>
  );
}
