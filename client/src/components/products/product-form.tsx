import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ProductWithArticles, insertProductSchema, ArticleWithStatus } from "@shared/schema";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  product?: ProductWithArticles;
  isLoading?: boolean;
}

// Extend the insertProductSchema for form validation
const productSchema = insertProductSchema.extend({
  id: z.number().optional(),
});

export type ProductFormData = {
  product: z.infer<typeof productSchema>;
  articles: {
    articleId: number;
    quantity: number;
  }[];
};

const ProductForm = ({
  isOpen,
  onClose,
  onSubmit,
  product,
  isLoading = false,
}: ProductFormProps) => {
  const [selectedArticles, setSelectedArticles] = useState<{
    [key: number]: { selected: boolean; quantity: number };
  }>({});
  
  const [categories] = useState([
    "Mobili",
    "Accessori",
    "Scatole",
    "Cornici",
    "Altro",
  ]);
  
  const { data: articles } = useQuery<ArticleWithStatus[]>({
    queryKey: ["/api/articles"],
  });
  
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      category: categories[0], // imposta il primo valore come default
      price: 0,
    },
  });
  
  useEffect(() => {
    if (product) {
      form.reset({
        id: product.id,
        code: product.code,
        name: product.name,
        description: product.description || "",
        category: product.category,
        price: product.price || 0,
      });
      
      // Set selected articles
      const articleSelection: {
        [key: number]: { selected: boolean; quantity: number };
      } = {};
      
      product.articles.forEach((pa) => {
        articleSelection[pa.articleId] = {
          selected: true,
          quantity: pa.quantity,
        };
      });
      
      setSelectedArticles(articleSelection);
    } else {
      form.reset({
        code: "",
        name: "",
        description: "",
        category: categories[0],
        price: 0,
      });
      
      setSelectedArticles({});
    }
  }, [product, form]);

  const handleArticleSelection = (articleId: number, selected: boolean) => {
    setSelectedArticles((prev) => ({
      ...prev,
      [articleId]: {
        selected,
        quantity: prev[articleId]?.quantity || 1,
      },
    }));
  };

  const handleArticleQuantity = (articleId: number, quantity: number) => {
    setSelectedArticles((prev) => ({
      ...prev,
      [articleId]: {
        selected: prev[articleId]?.selected || false,
        quantity: quantity,
      },
    }));
  };

  const handleSubmit = (data: z.infer<typeof productSchema>) => {
    const selectedArticlesList = Object.entries(selectedArticles)
      .filter(([_, value]) => value.selected)
      .map(([key, value]) => ({
        articleId: parseInt(key),
        quantity: value.quantity,
      }));
    
    onSubmit({
      product: data,
      articles: selectedArticlesList,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] p-4 sm:p-6">
        <DialogHeader className="mb-2 sm:mb-4">
          <DialogTitle className="text-lg sm:text-xl">
            {product ? "Modifica Prodotto" : "Nuovo Prodotto"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {product
              ? "Modifica le informazioni del prodotto esistente."
              : "Compila il form per aggiungere un nuovo prodotto."}
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
                      <FormLabel className="text-xs sm:text-sm">Codice Prodotto</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="PRD-001" 
                          className="text-sm h-8 sm:h-10"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Prezzo (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01"
                          {...field} 
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value}
                          placeholder="0.00" 
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
                    <FormLabel className="text-xs sm:text-sm">Nome Prodotto</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Nome del prodotto" 
                        className="text-sm h-8 sm:h-10"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Categoria</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="text-sm h-8 sm:h-10">
                          <SelectValue placeholder="Seleziona categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category} className="text-sm">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              
              <div>
                <Label className="text-xs sm:text-sm">Articoli Inclusi</Label>
                <div className="border border-neutral-300 rounded-md p-2 sm:p-3 mt-1 sm:mt-2">
                  <ScrollArea className="h-36 sm:h-48 pr-3">
                    <div className="space-y-2 sm:space-y-3">
                      {articles?.map((article) => (
                        <div
                          key={article.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <Checkbox
                              id={`article-${article.id}`}
                              checked={selectedArticles[article.id]?.selected || false}
                              onCheckedChange={(checked) =>
                                handleArticleSelection(
                                  article.id,
                                  checked === true
                                )
                              }
                              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                            />
                            <Label
                              htmlFor={`article-${article.id}`}
                              className="ml-2 text-xs sm:text-sm line-clamp-1 flex-1 mr-1"
                            >
                              {article.name} ({article.code})
                            </Label>
                          </div>
                          <Input
                            type="number"
                            min={1}
                            value={selectedArticles[article.id]?.quantity || 1}
                            onChange={(e) =>
                              handleArticleQuantity(
                                article.id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-12 sm:w-16 text-xs sm:text-sm h-6 sm:h-8"
                            disabled={!selectedArticles[article.id]?.selected}
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
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

export default ProductForm;
