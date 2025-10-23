import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { HelpSystem } from "./help-system";

interface HelpButtonProps {
  defaultRole?: "advisor" | "gp" | "operations";
}

export function HelpButton({ defaultRole = "operations" }: HelpButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        data-testid="button-help"
        title="Help & Guides"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
      <HelpSystem open={open} onOpenChange={setOpen} defaultRole={defaultRole} />
    </>
  );
}
