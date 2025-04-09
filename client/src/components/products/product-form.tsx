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
      category: "",
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
        category: "",
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {product ? "Modifica Prodotto" : "Nuovo Prodotto"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? "Modifica le informazioni del prodotto esistente."
              : "Compila il form per aggiungere un nuovo prodotto."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice Prodotto</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="PRD-001" />
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
                    <FormLabel>Nome Prodotto</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome del prodotto" />
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
                      <Textarea {...field} placeholder="Descrizione opzionale" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <Label>Articoli Inclusi</Label>
                <div className="border border-neutral-300 rounded-md p-3 mt-2">
                  <ScrollArea className="h-48 pr-4">
                    <div className="space-y-3">
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
                            />
                            <Label
                              htmlFor={`article-${article.id}`}
                              className="ml-2 text-sm"
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
                            className="w-16 text-sm"
                            disabled={!selectedArticles[article.id]?.selected}
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit" disabled={isLoading}>
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
