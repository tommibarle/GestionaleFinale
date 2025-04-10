import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArticleWithStatus, insertArticleSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ArticleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: z.infer<typeof schema>) => void;
  article?: ArticleWithStatus;
  isLoading?: boolean;
}

// Extend the insertArticleSchema for form validation
const schema = insertArticleSchema.extend({
  id: z.number().optional(),
});

const ArticleForm = ({
  isOpen,
  onClose,
  onSubmit,
  article,
  isLoading = false,
}: ArticleFormProps) => {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      category: "Altro", // Manteniamo un valore di default per evitare errori
      quantity: 0,
      threshold: 0,
    },
  });
  
  useEffect(() => {
    if (article) {
      form.reset({
        id: article.id,
        code: article.code,
        name: article.name,
        description: article.description || "",
        category: article.category,
        quantity: article.quantity,
        threshold: article.threshold,
      });
    } else {
      form.reset({
        code: "",
        name: "",
        description: "",
        category: "",
        quantity: 0,
        threshold: 0,
      });
    }
  }, [article, form]);

  const handleSubmit = (data: z.infer<typeof schema>) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-2 sm:mb-4">
          <DialogTitle className="text-lg sm:text-xl">
            {article ? "Modifica Articolo" : "Nuovo Articolo"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {article
              ? "Modifica le informazioni dell'articolo esistente."
              : "Compila il form per aggiungere un nuovo articolo."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Codice Articolo</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="ART-001" 
                          className="text-sm h-8 sm:h-10"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                

              </div>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Nome Articolo</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Nome dell'articolo" 
                        className="text-sm h-8 sm:h-10"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Descrizione</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field as any} 
                        placeholder="Descrizione opzionale" 
                        className="text-sm min-h-[60px] sm:min-h-[80px] resize-none"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Quantità</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="text-sm h-8 sm:h-10"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Soglia minima</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="text-sm h-8 sm:h-10"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4 sm:mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
              >
                Annulla
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
              >
                {isLoading ? "Salvataggio..." : "Salva"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ArticleForm;
