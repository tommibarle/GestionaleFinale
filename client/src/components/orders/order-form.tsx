import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ProductWithArticles, insertOrderSchema } from "@shared/schema";
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

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OrderFormData) => void;
  isLoading?: boolean;
}

// Extend the insertOrderSchema for form validation
const orderSchema = insertOrderSchema.extend({
  id: z.number().optional(),
});

export type OrderFormData = {
  order: z.infer<typeof orderSchema>;
  products: {
    productId: number;
    quantity: number;
  }[];
};

const OrderForm = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: OrderFormProps) => {
  const [selectedProducts, setSelectedProducts] = useState<{
    [key: number]: { selected: boolean; quantity: number };
  }>({});
  
  const { data: products } = useQuery<ProductWithArticles[]>({
    queryKey: ["/api/products"],
  });
  
  const form = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      code: `ORD-${new Date().getTime().toString().slice(-4)}`,
      notes: "",
      status: "pending",
    },
  });
  
  useEffect(() => {
    // Reset form when opened
    form.reset({
      code: `ORD-${new Date().getTime().toString().slice(-4)}`,
      notes: "",
      status: "pending",
    });
    
    // Clear selected products
    setSelectedProducts({});
  }, [isOpen, form]);

  const handleProductSelection = (productId: number, selected: boolean) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        selected,
        quantity: prev[productId]?.quantity || 1,
      },
    }));
  };

  const handleProductQuantity = (productId: number, quantity: number) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        selected: prev[productId]?.selected || false,
        quantity: quantity,
      },
    }));
  };

  const handleSubmit = (data: z.infer<typeof orderSchema>) => {
    const selectedProductsList = Object.entries(selectedProducts)
      .filter(([_, value]) => value.selected)
      .map(([key, value]) => ({
        productId: parseInt(key),
        quantity: value.quantity,
      }));
    
    if (selectedProductsList.length === 0) {
      form.setError("root", {
        type: "manual",
        message: "Seleziona almeno un prodotto per creare un ordine",
      });
      return;
    }
    
    onSubmit({
      order: data,
      products: selectedProductsList,
    });
  };

  // Filter only available products
  const availableProducts = products?.filter(
    product => product.availability !== "unavailable"
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nuovo Ordine</DialogTitle>
          <DialogDescription>
            Compila il form per creare un nuovo ordine. Seleziona uno o più prodotti da includere.
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
                    <FormLabel>Codice Ordine</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Note opzionali" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <Label>Seleziona Prodotti</Label>
                <div className="border border-neutral-300 rounded-md p-3 mt-2">
                  <ScrollArea className="h-48 pr-4">
                    {availableProducts.length > 0 ? (
                      <div className="space-y-3">
                        {availableProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <Checkbox
                                id={`product-${product.id}`}
                                checked={selectedProducts[product.id]?.selected || false}
                                onCheckedChange={(checked) =>
                                  handleProductSelection(
                                    product.id,
                                    checked === true
                                  )
                                }
                              />
                              <Label
                                htmlFor={`product-${product.id}`}
                                className="ml-2 text-sm"
                              >
                                {product.name} ({product.code})
                                <span className="ml-2 text-xs text-neutral-500">
                                  {product.availability === "limited" && "(Disponibilità limitata)"}
                                </span>
                              </Label>
                            </div>
                            <Input
                              type="number"
                              min={1}
                              value={selectedProducts[product.id]?.quantity || 1}
                              onChange={(e) =>
                                handleProductQuantity(
                                  product.id,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-16 text-sm"
                              disabled={!selectedProducts[product.id]?.selected}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-neutral-500">
                        Nessun prodotto disponibile per l'ordine
                      </div>
                    )}
                  </ScrollArea>
                </div>
                {form.formState.errors.root && (
                  <p className="text-sm font-medium text-destructive mt-2">
                    {form.formState.errors.root.message}
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creazione..." : "Crea Ordine"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;
