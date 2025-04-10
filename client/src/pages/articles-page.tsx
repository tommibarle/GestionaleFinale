import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ArticleTable from "@/components/articles/article-table";
import ArticleForm from "@/components/articles/article-form";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArticleWithStatus } from "@shared/schema";

const ArticlesPage = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ArticleWithStatus | undefined>(undefined);
  
  // Mutation for creating/updating an article
  const articleMutation = useMutation({
    mutationFn: async (data: Partial<ArticleWithStatus>) => {
      if (data.id) {
        // Update existing article
        const res = await apiRequest("PUT", `/api/articles/${data.id}`, data);
        return res.json();
      } else {
        // Create new article
        const res = await apiRequest("POST", "/api/articles", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setFormOpen(false);
      toast({
        title: selectedArticle ? "Articolo aggiornato" : "Articolo creato",
        description: selectedArticle 
          ? "L'articolo è stato aggiornato con successo" 
          : "Il nuovo articolo è stato creato con successo",
      });
      setSelectedArticle(undefined);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for deleting an article
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDeleteDialogOpen(false);
      toast({
        title: "Articolo eliminato",
        description: "L'articolo è stato eliminato con successo",
      });
      setSelectedArticle(undefined);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleNewArticle = () => {
    setSelectedArticle(undefined);
    setFormOpen(true);
  };
  
  const handleEditArticle = (article: ArticleWithStatus) => {
    setSelectedArticle(article);
    setFormOpen(true);
  };
  
  const handleDeleteArticle = (article: ArticleWithStatus) => {
    setSelectedArticle(article);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedArticle) {
      deleteMutation.mutate(selectedArticle.id);
    }
  };
  
  const handleFormSubmit = (data: any) => {
    articleMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar isMobile={isMobile} />
      
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <Header title="Gestione Articoli" />
        
        <section className="p-3 md:p-6">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-neutral-800">Articoli</h2>
              <Button 
                className="flex items-center gap-2 w-full sm:w-auto"
                onClick={handleNewArticle}
              >
                <Plus size={16} />
                <span>Nuovo Articolo</span>
              </Button>
            </div>
            
            <ArticleTable
              onEdit={handleEditArticle}
              onDelete={handleDeleteArticle}
            />
            
            <ArticleForm
              isOpen={formOpen}
              onClose={() => setFormOpen(false)}
              onSubmit={handleFormSubmit}
              article={selectedArticle}
              isLoading={articleMutation.isPending}
            />
            
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-base md:text-lg">Conferma eliminazione</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    Sei sicuro di voler eliminare l'articolo "{selectedArticle?.name}"? Questa azione non può essere annullata.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                  <AlertDialogCancel className="mt-0 sm:mt-0">Annulla</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={confirmDelete}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ArticlesPage;
