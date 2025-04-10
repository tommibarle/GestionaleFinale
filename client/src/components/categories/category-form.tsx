import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Category, insertCategorySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Schema esteso per la validazione del form
const formSchema = insertCategorySchema.extend({
  code: z.string().min(2, {
    message: "Il codice deve contenere almeno 2 caratteri",
  }),
  name: z.string().min(2, {
    message: "Il nome deve contenere almeno 2 caratteri",
  }),
});

type CategoryFormProps = {
  category?: Category;
  isOpen: boolean;
  onClose: () => void;
};

export default function CategoryForm({ category, isOpen, onClose }: CategoryFormProps) {
  const isEditMode = !!category;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        code: category.code,
        name: category.name,
        description: category.description || "",
      });
    } else {
      form.reset({
        code: "",
        name: "",
        description: "",
      });
    }
  }, [category, form]);

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/categories", values);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      form.reset();
      onClose();
      toast({
        title: "Categoria creata",
        description: "La categoria è stata creata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: "Impossibile creare la categoria: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest(
        "PATCH",
        "/api/categories/" + category?.id,
        values
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      form.reset();
      onClose();
      toast({
        title: "Categoria aggiornata",
        description: "La categoria è stata aggiornata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la categoria: " + error.message,
        variant: "destructive",
      });
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditMode) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifica categoria" : "Nuova categoria"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Modifica i dettagli della categoria esistente."
              : "Aggiungi una nuova categoria per organizzare gli articoli."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codice</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Inserisci il codice (es. CAT1)" 
                      {...field} 
                      disabled={isEditMode || isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Inserisci il nome della categoria" 
                      {...field} 
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Inserisci una descrizione opzionale" 
                      className="resize-none" 
                      {...field} 
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
                Annulla
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : isEditMode ? (
                  "Aggiorna"
                ) : (
                  "Crea"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}