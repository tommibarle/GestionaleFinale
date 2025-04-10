import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import CategoryForm from "./category-form";
import { Category } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CategoryTable() {
  const [categoryToEdit, setCategoryToEdit] = useState<Category | undefined>(undefined);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);

  const { data: categories, isLoading, error } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setCategoryToDelete(undefined);
      toast({
        title: "Categoria eliminata",
        description: "La categoria è stata eliminata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare la categoria: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (category: Category) => {
    setCategoryToEdit(category);
    setFormOpen(true);
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 px-6 bg-destructive/10 text-destructive rounded-md">
        Errore nel caricamento delle categorie: {error.message}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => {
              setCategoryToEdit(undefined);
              setFormOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Nuova Categoria</span>
          </Button>
        </div>
      </div>

      {categories && categories.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Codice</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrizione</TableHead>
                <TableHead className="text-right w-[120px]">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.code}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{category.description || "-"}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-8 border rounded-md bg-muted/10">
          <p className="text-muted-foreground mb-2">Nessuna categoria trovata</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCategoryToEdit(undefined);
              setFormOpen(true);
            }}
          >
            Aggiungi la tua prima categoria
          </Button>
        </div>
      )}

      <CategoryForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        category={categoryToEdit}
      />

      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Gli articoli associati a questa categoria potrebbero essere influenzati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Elimina"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}