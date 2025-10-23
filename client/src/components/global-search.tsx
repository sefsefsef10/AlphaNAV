import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { 
  FileText, 
  Briefcase, 
  Building2, 
  UserCircle, 
  TrendingUp,
  Loader2,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  type: 'deal' | 'prospect' | 'facility' | 'advisor' | 'advisor-deal';
  title: string;
  subtitle?: string;
  status?: string;
  metadata?: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  // Keyboard shortcut to open search (cmd+k or ctrl+k)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search query with debouncing via enabled flag
  const { data, isLoading } = useQuery<SearchResponse>({
    queryKey: ["/api/search", searchQuery],
    enabled: searchQuery.length >= 2, // Only search if 2+ characters
  });

  const handleSelect = (result: SearchResult) => {
    // Navigate based on result type
    // Note: These routes navigate to existing list/dashboard pages
    // In the future, we can create entity-specific detail pages
    switch (result.type) {
      case 'deal':
        setLocation(`/gp`); // GP Dashboard where deals are managed
        break;
      case 'prospect':
        setLocation(`/deal-pipeline`); // Operations dashboard with deal pipeline
        break;
      case 'facility':
        setLocation(`/gp/facility`); // GP Facility management page
        break;
      case 'advisor':
        setLocation(`/advisor`); // Advisor dashboard
        break;
      case 'advisor-deal':
        setLocation(`/advisor/active-rfps`); // Advisor RFPs page
        break;
      default:
        break;
    }
    setOpen(false);
    setSearchQuery("");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'deal':
        return <FileText className="h-4 w-4" />;
      case 'prospect':
        return <Building2 className="h-4 w-4" />;
      case 'facility':
        return <TrendingUp className="h-4 w-4" />;
      case 'advisor':
        return <UserCircle className="h-4 w-4" />;
      case 'advisor-deal':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "default";
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes("active") || statusLower.includes("approved")) return "default";
    if (statusLower.includes("pending")) return "secondary";
    if (statusLower.includes("rejected") || statusLower.includes("defaulted")) return "destructive";
    if (statusLower.includes("completed")) return "outline";
    return "default";
  };

  // Group results by type
  const groupedResults = data?.results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>) || {};

  const typeLabels: Record<string, string> = {
    'deal': 'GP Deals',
    'prospect': 'Prospects',
    'facility': 'Facilities',
    'advisor': 'Advisors',
    'advisor-deal': 'Advisor Deals',
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Search deals, prospects, facilities, advisors..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
        data-testid="input-global-search"
      />
      <CommandList>
        {isLoading && searchQuery.length >= 2 && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && searchQuery.length >= 2 && data?.results.length === 0 && (
          <CommandEmpty>No results found for "{searchQuery}"</CommandEmpty>
        )}

        {!isLoading && searchQuery.length < 2 && (
          <CommandEmpty>
            <div className="text-center py-6">
              <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Type at least 2 characters to search
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Press <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘K</kbd> or{" "}
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+K</kbd> to toggle
              </p>
            </div>
          </CommandEmpty>
        )}

        {!isLoading && Object.keys(groupedResults).map((type, idx) => (
          <div key={type}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={typeLabels[type] || type}>
              {groupedResults[type].map((result) => (
                <CommandItem
                  key={`${result.type}-${result.id}`}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center justify-between gap-2"
                  data-testid={`search-result-${result.type}-${result.id}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getIcon(result.type)}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-medium truncate">
                        {result.title}
                      </span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                  {result.status && (
                    <Badge 
                      variant={getStatusColor(result.status) as any}
                      className="shrink-0"
                    >
                      {result.status}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
