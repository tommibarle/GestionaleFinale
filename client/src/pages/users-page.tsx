import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Schema per il form degli utenti
const userFormSchema = z.object({
  name: z.string().min(1, { message: "Il nome è obbligatorio" }),
  email: z.string().email({ message: "Email non valida" }),
  password: z
    .string()
    .min(6, { message: "La password deve essere di almeno 6 caratteri" })
    .optional(),
  role: z.string().min(1, { message: "Il ruolo è obbligatorio" }),
});

// Ruoli disponibili
const roles = ["admin", "operator"];

// Tipo per l'utente nel contesto dell'UI
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface UserFormData {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role: string;
}

const UsersPage = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Recupera la lista degli utenti
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Form per la creazione/modifica utenti
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: roles[0],
    },
  });
  
  // Mutation per creare/modificare utenti
  const userMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      if (data.id) {
        // Aggiorna utente esistente
        const res = await apiRequest("PUT", `/api/users/${data.id}`, data);
        return res.json();
      } else {
        // Crea nuovo utente
        const res = await apiRequest("POST", "/api/users", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setFormOpen(false);
      toast({
        title: selectedUser ? "Utente aggiornato" : "Utente creato",
        description: selectedUser 
          ? "L'utente è stato aggiornato con successo" 
          : "Il nuovo utente è stato creato con successo",
      });
      setSelectedUser(null);
      form.reset({
        name: "",
        email: "",
        password: "",
        role: roles[0],
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
  
  // Mutation per eliminare utenti
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDeleteDialogOpen(false);
      toast({
        title: "Utente eliminato",
        description: "L'utente è stato eliminato con successo",
      });
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleNewUser = () => {
    setSelectedUser(null);
    form.reset({
      name: "",
      email: "",
      password: "",
      role: roles[0],
    });
    setFormOpen(true);
  };
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    form.reset({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      password: "", // Non includiamo la password esistente
    });
    setFormOpen(true);
  };
  
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id);
    }
  };
  
  const onSubmit = (data: UserFormData) => {
    // Se è un aggiornamento e non è stata inserita una nuova password, rimuoviamo il campo
    if (data.id && (!data.password || data.password.trim() === "")) {
      const { password, ...userWithoutPassword } = data;
      userMutation.mutate(userWithoutPassword);
    } else {
      userMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar isMobile={isMobile} />
      
      <main className="flex-1 overflow-auto">
        <Header title="Gestione Utenti" />
        
        <section className="p-4 md:p-6">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-neutral-800">Utenti</h2>
              <Button 
                className="flex items-center gap-2"
                onClick={handleNewUser}
              >
                <Plus size={16} />
                <span>Nuovo Utente</span>
              </Button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-10">Caricamento utenti...</div>
            ) : !users || users.length === 0 ? (
              <div className="text-center py-10">Nessun utente trovato</div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ruolo</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.role === "admin" 
                              ? "bg-purple-100 text-purple-800" 
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {user.role === "admin" ? "Amministratore" : "Operatore"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditUser(user)}
                            className="mr-2"
                          >
                            Modifica
                          </Button>
                          {/* Non permettere l'eliminazione del proprio account */}
                          {user.id !== 1 && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                            >
                              Elimina
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            <Dialog open={formOpen} onOpenChange={(open) => setFormOpen(open)}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedUser ? "Modifica Utente" : "Nuovo Utente"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedUser
                      ? "Modifica le informazioni dell'utente esistente."
                      : "Compila il form per aggiungere un nuovo utente."}
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome dell'utente" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email"
                              placeholder="esempio@azienda.com" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {selectedUser 
                              ? "Password (lascia vuoto per non modificare)" 
                              : "Password"}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password"
                              placeholder="Password sicura" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ruolo</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona un ruolo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Amministratore</SelectItem>
                              <SelectItem value="operator">Operatore</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setFormOpen(false)}
                      >
                        Annulla
                      </Button>
                      <Button 
                        type="submit"
                        disabled={userMutation.isPending}
                      >
                        {userMutation.isPending ? "Salvando..." : "Salva"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sei sicuro di voler eliminare l'utente "{selectedUser?.name}"? Questa azione non può essere annullata.
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

export default UsersPage;