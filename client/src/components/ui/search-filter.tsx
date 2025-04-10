import { useState, useEffect } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export interface FilterOption {
  id: string;
  label: string;
  value: boolean;
}

interface SearchFilterProps {
  placeholder?: string;
  filters?: FilterOption[];
  onSearch: (searchTerm: string, activeFilters: Record<string, boolean>) => void;
  className?: string;
}

export function SearchFilter({
  placeholder = "Cerca...",
  filters = [],
  onSearch,
  className = "",
}: SearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>(
    filters.reduce((acc, filter) => ({ ...acc, [filter.id]: filter.value }), {})
  );
  const [showFilterBadge, setShowFilterBadge] = useState(false);

  useEffect(() => {
    // Controlla se ci sono filtri attivi
    const hasActiveFilters = Object.values(activeFilters).some(value => value);
    setShowFilterBadge(hasActiveFilters);
  }, [activeFilters]);

  const handleSearch = () => {
    onSearch(searchTerm, activeFilters);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleFilterChange = (id: string, checked: boolean) => {
    const newFilters = { ...activeFilters, [id]: checked };
    setActiveFilters(newFilters);
    onSearch(searchTerm, newFilters);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    onSearch("", activeFilters);
  };

  const countActiveFilters = Object.values(activeFilters).filter(v => v).length;

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div className="relative flex items-center w-full">
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pr-[70px] text-sm h-9"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearSearch}
            className="absolute right-[34px] h-7 w-7 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cancella ricerca</span>
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSearch}
          className="absolute right-0 h-9 w-9"
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">Cerca</span>
        </Button>
      </div>

      {filters.length > 0 && (
        <div className="flex justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs relative">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                Filtri
                {showFilterBadge && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-2 -right-2 h-5 min-w-5 p-0 flex items-center justify-center text-[10px]"
                  >
                    {countActiveFilters}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-3" align="end">
              <div className="space-y-3">
                <p className="text-xs font-medium mb-2">Filtra per:</p>
                {filters.map((filter) => (
                  <div key={filter.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`filter-${filter.id}`}
                      checked={activeFilters[filter.id]}
                      onCheckedChange={(checked) =>
                        handleFilterChange(filter.id, checked === true)
                      }
                    />
                    <Label
                      htmlFor={`filter-${filter.id}`}
                      className="text-xs leading-none"
                    >
                      {filter.label}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}