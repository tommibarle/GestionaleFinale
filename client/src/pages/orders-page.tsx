import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import OrderTable from "@/components/orders/order-table";
import OrderForm, { OrderFormData } from "@/components/orders/order-form";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderWithProducts } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const OrdersPage = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [formOpen, setFormOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithProducts | undefined>(undefined);
  
  // Mutation for creating a new order
  const orderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      setFormOpen(false);
      toast({
        title: "Ordine creato",
        description: "Il nuovo ordine è stato creato con successo",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for deleting an order
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      setDeleteDialogOpen(false);
      toast({
        title: "Ordine eliminato",
        description: "L'ordine è stato eliminato con successo",
      });
      setSelectedOrder(undefined);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleNewOrder = () => {
    setFormOpen(true);
  };
  
  const handleViewOrder = (order: OrderWithProducts) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };
  
  const handleDeleteOrder = (order: OrderWithProducts) => {
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedOrder) {
      deleteMutation.mutate(selectedOrder.id);
    }
  };
  
  const handleFormSubmit = (data: OrderFormData) => {
    orderMutation.mutate(data);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completato";
      case "pending":
        return "In corso";
      case "cancelled":
        return "Annullato";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar isMobile={isMobile} />
      
      <main className="flex-1 overflow-auto">
        <Header title="Gestione Ordini" />
        
        <section className="p-4 md:p-6">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-neutral-800">Ordini</h2>
              <Button 
                className="flex items-center gap-2"
                onClick={handleNewOrder}
              >
                <Plus size={16} />
                <span>Nuovo Ordine</span>
              </Button>
            </div>
            
            <OrderTable
              onView={handleViewOrder}
              onDelete={handleDeleteOrder}
            />
            
            <OrderForm
              isOpen={formOpen}
              onClose={() => setFormOpen(false)}
              onSubmit={handleFormSubmit}
              isLoading={orderMutation.isPending}
            />
            
            {/* Order View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Dettagli Ordine</DialogTitle>
                  <DialogDescription>
                    Informazioni dettagliate sull'ordine selezionato.
                  </DialogDescription>
                </DialogHeader>
                
                {selectedOrder && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-neutral-500">Codice Ordine</h4>
                        <p className="text-base">{selectedOrder.code}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-neutral-500">Data</h4>
                        <p className="text-base">{formatDate(selectedOrder.createdAt)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-neutral-500">Stato</h4>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedOrder.status)}`}>
                          {getStatusText(selectedOrder.status)}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-neutral-500">Note</h4>
                        <p className="text-base">{selectedOrder.notes || "-"}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500 mb-2">Prodotti nell'ordine</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Prodotto</TableHead>
                            <TableHead>Codice</TableHead>
                            <TableHead>Quantità</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.products.map((op) => (
                            <TableRow key={op.id}>
                              <TableCell>{op.product.name}</TableCell>
                              <TableCell>{op.product.code}</TableCell>
                              <TableCell className="font-medium">{op.quantity}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sei sicuro di voler eliminare l'ordine "{selectedOrder?.code}"? Gli articoli utilizzati verranno restituiti al magazzino. Questa azione non può essere annullata.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
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

export default OrdersPage;
