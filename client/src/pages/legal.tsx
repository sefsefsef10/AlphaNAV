import { Scale } from "lucide-react";
import { LegalTemplateBuilder } from "@/components/legal-template-builder";

export default function LegalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Legal Templates</h1>
        <p className="text-muted-foreground mt-1">
          Configure and generate NAV lending agreement templates
        </p>
      </div>

      <LegalTemplateBuilder />
    </div>
  );
}
