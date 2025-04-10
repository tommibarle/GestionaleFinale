import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Trash2, Search } from "lucide-react";
import { ProductWithArticles } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

interface ProductGridProps {
  onEdit: (product: ProductWithArticles) => void;
  onDelete: (product: ProductWithArticles) => void;
}

const ProductGrid = ({ onEdit, onDelete }: ProductGridProps) => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const isMobile = useIsMobile();

  const { data: products, isLoading } = useQuery<ProductWithArticles[]>({
    queryKey: ["/api/products"],
  });

  if (isLoading) {
    return <div className="text-center py-4">Caricamento prodotti...</div>;
  }

  if (!products || products.length === 0) {
    return <div className="text-center py-4">Nessun prodotto trovato</div>;
  }

  // Apply filters
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      search === "" ||
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.code.toLowerCase().includes(search.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    const matchesAvailability =
      availabilityFilter === "all" || product.availability === availabilityFilter;

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Get unique categories for filter
  const categories = [...new Set(products.map((product) => product.category || "Altro"))];

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getAvailabilityBadgeClass = (availability: string) => {
    switch (availability) {
      case "available":
        return "bg-green-100 text-green-800";
      case "limited":
        return "bg-yellow-100 text-yellow-800";
      case "unavailable":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case "available":
        return "Disponibile";
      case "limited":
        return "Disponibilità limitata";
      case "unavailable":
        return "Non disponibile";
      default:
        return availability;
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 mb-4 md:mb-6">
        <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Cerca prodotti..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full text-sm"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
              <Search size={16} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[160px] text-sm">
                <SelectValue placeholder="Tutte le categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="w-full sm:w-[160px] text-sm">
                <SelectValue placeholder="Tutti gli stati" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="available">Disponibile</SelectItem>
                <SelectItem value="limited">Disponibilità limitata</SelectItem>
                <SelectItem value="unavailable">Non disponibile</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {paginatedProducts.map((product) => (
          <Card key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <CardContent className="p-3 md:p-5">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-2">
                  <h3 className="text-base md:text-lg font-semibold text-neutral-800 line-clamp-1">{product.name}</h3>
                  {product.description && (
                    <p className="text-xs md:text-sm text-neutral-600 mt-1 line-clamp-2">{product.description}</p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded whitespace-nowrap ${getAvailabilityBadgeClass(
                    product.availability
                  )}`}
                >
                  {getAvailabilityText(product.availability)}
                </span>
              </div>

              <div className="mt-3 md:mt-4">
                <h4 className="text-xs md:text-sm font-medium text-neutral-700 mb-1 md:mb-2">
                  Articoli inclusi:
                </h4>
                <ul className="text-xs md:text-sm text-neutral-600 space-y-1 max-h-[90px] overflow-y-auto pr-1">
                  {product.articles.map((pa) => (
                    <li
                      key={pa.id}
                      className="flex justify-between items-center"
                    >
                      <span className="line-clamp-1 pr-2">{pa.article.name}</span>
                      <span className="font-medium whitespace-nowrap">x{pa.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-neutral-200 flex justify-between items-center">
                <div>
                  <span className="text-xs md:text-sm text-neutral-500">Codice: {product.code}</span>
                </div>
                <div className="flex space-x-1 md:space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(product)}
                    aria-label="Modifica prodotto"
                  >
                    <Pencil className="h-4 w-4 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(product)}
                    aria-label="Elimina prodotto"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 md:mt-6 flex justify-center">
          <Pagination>
            <PaginationContent className="flex-wrap justify-center">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={`text-xs md:text-sm ${currentPage === 1 ? "pointer-events-none opacity-50" : ""}`}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                // On mobile, only show a limited number of page links
                const shouldShowAll = totalPages <= 5; // Show all if total pages is small
                const shouldShow = shouldShowAll || 
                  i === 0 || // Always show first page
                  i === totalPages - 1 || // Always show last page
                  Math.abs(i + 1 - currentPage) <= 1; // Show current page and one before/after
                
                if (!shouldShow && (i === 1 || i === totalPages - 2)) {
                  return <PaginationItem key={i} className="mx-1">...</PaginationItem>;
                }
                
                if (!shouldShow) return null;
                
                return (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(i + 1);
                      }}
                      isActive={currentPage === i + 1}
                      className="text-xs md:text-sm"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                  className={`text-xs md:text-sm ${currentPage === totalPages ? "pointer-events-none opacity-50" : ""}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <div className="text-xs md:text-sm text-center text-gray-600 mt-2">
            {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProducts.length)} di {filteredProducts.length}
          </div>
        </div>
      )}
    </>
  );
};

export default ProductGrid;
