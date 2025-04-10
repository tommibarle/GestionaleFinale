import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ProductGrid from "@/components/products/product-grid";
import ProductForm, { ProductFormData } from "@/components/products/product-form";
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
import { ProductWithArticles } from "@shared/schema";

const ProductsPage = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithArticles | undefined>(undefined);
  
  // Mutation for creating/updating a product
  const productMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (data.product.id) {
        // Update existing product
        const res = await apiRequest("PUT", `/api/products/${data.product.id}`, data);
        return res.json();
      } else {
        // Create new product
        const res = await apiRequest("POST", "/api/products", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setFormOpen(false);
      toast({
        title: selectedProduct ? "Prodotto aggiornato" : "Prodotto creato",
        description: selectedProduct 
          ? "Il prodotto è stato aggiornato con successo" 
          : "Il nuovo prodotto è stato creato con successo",
      });
      setSelectedProduct(undefined);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for deleting a product
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDeleteDialogOpen(false);
      toast({
        title: "Prodotto eliminato",
        description: "Il prodotto è stato eliminato con successo",
      });
      setSelectedProduct(undefined);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleNewProduct = () => {
    setSelectedProduct(undefined);
    setFormOpen(true);
  };
  
  const handleEditProduct = (product: ProductWithArticles) => {
    setSelectedProduct(product);
    setFormOpen(true);
  };
  
  const handleDeleteProduct = (product: ProductWithArticles) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedProduct) {
      deleteMutation.mutate(selectedProduct.id);
    }
  };
  
  const handleFormSubmit = (data: ProductFormData) => {
    productMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar isMobile={isMobile} />
      
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <Header title="Gestione Prodotti" />
        
        <section className="p-3 md:p-6">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-neutral-800">Prodotti</h2>
              <Button 
                className="flex items-center gap-2 w-full sm:w-auto"
                onClick={handleNewProduct}
              >
                <Plus size={16} />
                <span>Nuovo Prodotto</span>
              </Button>
            </div>
            
            <ProductGrid
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
            />
            
            <ProductForm
              isOpen={formOpen}
              onClose={() => setFormOpen(false)}
              onSubmit={handleFormSubmit}
              product={selectedProduct}
              isLoading={productMutation.isPending}
            />
            
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-base md:text-lg">Conferma eliminazione</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    Sei sicuro di voler eliminare il prodotto "{selectedProduct?.name}"? Questa azione non può essere annullata.
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

export default ProductsPage;
