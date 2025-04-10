import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Trash2, Search } from "lucide-react";
import { ArticleWithStatus } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

interface ArticleTableProps {
  onEdit: (article: ArticleWithStatus) => void;
  onDelete: (article: ArticleWithStatus) => void;
}

const ArticleTable = ({ onEdit, onDelete }: ArticleTableProps) => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const isMobile = useIsMobile();

  const { data: articles, isLoading } = useQuery<ArticleWithStatus[]>({
    queryKey: ["/api/articles"],
  });

  if (isLoading) {
    return <div className="text-center py-4">Caricamento articoli...</div>;
  }

  if (!articles || articles.length === 0) {
    return <div className="text-center py-4">Nessun articolo trovato</div>;
  }

  // Apply filters
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      search === "" ||
      article.name.toLowerCase().includes(search.toLowerCase()) ||
      article.code.toLowerCase().includes(search.toLowerCase()) ||
      (article.description && article.description.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === "all" || article.category === categoryFilter;

    const matchesStatus =
      statusFilter === "all" || article.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories for filter
  const categories = [...new Set(articles.map((article) => article.category))];

  // Pagination
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedArticles = filteredArticles.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "low":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-red-100 text-red-800";
      case "out":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Disponibile";
      case "low":
        return "Sotto soglia";
      case "critical":
        return "Critico";
      case "out":
        return "Esaurito";
      default:
        return status;
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 mb-4 md:mb-6">
        <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Cerca articoli..."
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] text-sm">
                <SelectValue placeholder="Tutti gli stati" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="available">Disponibile</SelectItem>
                <SelectItem value="low">Sotto soglia</SelectItem>
                <SelectItem value="critical">Critico</SelectItem>
                <SelectItem value="out">Esaurito</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden md:table-cell">Codice</TableHead>
                <TableHead>Articolo</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead className="text-center">Quantità</TableHead>
                <TableHead className="hidden md:table-cell">Soglia</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right md:text-left">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="hidden md:table-cell font-medium text-xs md:text-sm">{article.code}</TableCell>
                  <TableCell>
                    <div className="font-medium text-xs md:text-sm">{article.name}</div>
                    <div className="text-xs text-neutral-500 md:hidden">
                      {article.code} - {article.category}
                    </div>
                    {article.description && (
                      <div className="text-xs text-neutral-500 line-clamp-1 md:line-clamp-2">
                        {article.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs md:text-sm">{article.category}</TableCell>
                  <TableCell className="text-center text-xs md:text-sm">
                    <span className="font-medium">{article.quantity}</span>
                    <span className="md:hidden text-xs text-neutral-500"> / {article.threshold}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs md:text-sm">{article.threshold}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                        article.status
                      )}`}
                    >
                      {getStatusText(article.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right md:text-left">
                    <div className="flex space-x-1 md:space-x-2 justify-end md:justify-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(article)}
                        aria-label="Modifica articolo"
                      >
                        <Pencil className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(article)}
                        aria-label="Elimina articolo"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="py-3 px-3 md:py-4 md:px-6 border-t border-gray-200">
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
                  // On mobile, show only current, first, last and one before/after current
                  const isMobileView = isMobile;
                  
                  // Check if this page number should be visible
                  const isVisible = !isMobileView || 
                    i === 0 || // Always show first page
                    i === totalPages - 1 || // Always show last page
                    Math.abs(i + 1 - currentPage) <= 1; // Show current page and one before/after
                  
                  // Show ellipsis for hidden pages
                  if (!isVisible && (i === 1 || i === totalPages - 2)) {
                    return <PaginationItem key={i} className="mx-1">...</PaginationItem>;
                  }
                  
                  if (!isVisible) return null;
                  
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
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredArticles.length)} di {filteredArticles.length} risultati
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ArticleTable;
